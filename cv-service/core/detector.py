import cv2
import asyncio
import time
import numpy as np
from ultralytics import YOLO
from config import settings
from schemas.events import DetectionEvent, AlertEvent, PersonDetection, VehicleDetection
from core.zone_manager import zone_manager
from core.crowd_detector import crowd_detector
from core.gemini_client import detect_gender, detect_abnormal_activity, clear_gender_cache
from publishers.redis_publisher import publisher
import logging

logger = logging.getLogger(__name__)

_model = YOLO(settings.yolo_model)

# Intrusion cooldown: track_id → last_alert_time
_intrusion_cooldown: dict[int, float] = {}
INTRUSION_COOLDOWN_SEC = 15


class DetectionPipeline:
    def __init__(self):
        self._running = False
        self._frame_count = 0
        self._last_abnormal_check = 0.0
        self._camera_id = "cam1"

    @property
    def is_running(self) -> bool:
        return self._running

    async def start(self, source: str) -> None:
        if self._running:
            return
        self._running = True
        asyncio.create_task(self._run(source))
        logger.info(f"Detection pipeline started for source: {source}")

    def stop(self) -> None:
        self._running = False
        logger.info("Detection pipeline stopping.")

    async def _run(self, source: str) -> None:
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            logger.error(f"Cannot open video source: {source}")
            self._running = False
            return

        try:
            while self._running:
                ret, frame = cap.read()
                if not ret:
                    # Loop video file back to start
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue

                self._frame_count += 1

                # Skip frames for performance
                if self._frame_count % settings.frame_skip != 0:
                    await asyncio.sleep(0)
                    continue

                await self._process_frame(frame, self._frame_count)

                # Prune stale gender cache entries periodically
                if self._frame_count % 100 == 0:
                    clear_gender_cache()

                await asyncio.sleep(0)  # yield to event loop

        except Exception as e:
            logger.exception(f"Pipeline error: {e}")
        finally:
            cap.release()
            self._running = False
            logger.info("Pipeline stopped, video released.")

    async def _process_frame(self, frame: np.ndarray, frame_id: int) -> None:
        results = _model.track(
            frame,
            persist=True,
            verbose=False,
            conf=0.25,
            classes=([settings.person_class_id] + settings.vehicle_class_ids),
        )

        # ── Debug line (safe — uses results directly) ─────────────────────
        box_count = len(results[0].boxes) if results and results[0].boxes is not None else 0
        print(f"[Frame {frame_id}] Raw detections: {box_count}")

        if not results or results[0].boxes is None:
            return

        boxes = results[0].boxes

        # ── Initialize BEFORE using ───────────────────────────────────────
        people: list[PersonDetection] = []
        vehicles: list[VehicleDetection] = []
        person_bboxes: list[list[float]] = []

        for box in boxes:
            cls_id   = int(box.cls[0])
            conf     = float(box.conf[0])
            bbox     = box.xyxy[0].tolist()
            track_id = int(box.id[0]) if box.id is not None else -1

            if cls_id == settings.person_class_id:
                person_bboxes.append(bbox)
                people.append(PersonDetection(
                    track_id=track_id,
                    bbox=bbox,
                    confidence=conf,
                ))
            elif cls_id in settings.vehicle_class_ids:
                vtype = settings.vehicle_label_map.get(cls_id, "unknown")
                vehicles.append(VehicleDetection(
                    track_id=track_id,
                    vehicle_type=vtype,
                    bbox=bbox,
                    confidence=conf,
                ))

        # ── Safe debug print AFTER people/vehicles are built ─────────────
        print(f"[Frame {frame_id}] → {len(people)} people, {len(vehicles)} vehicles")

        # ── Gender detection ──────────────────────────────────────────────
        gender_tasks = [
            detect_gender(frame, p.bbox, p.track_id)
            for p in people
        ]
        genders = await asyncio.gather(*gender_tasks, return_exceptions=True)
        for person, gender in zip(people, genders):
            if isinstance(gender, str):
                person.gender = gender

    # ── Intrusion detection ───────────────────────────────────────────
        # ── Intrusion detection ───────────────────────────────────────────────
        _now = time.time()
        for person in people:
            violated_zone = zone_manager.check_intrusion(
                person.bbox, self._camera_id
            )
            if violated_zone:
                last = _intrusion_cooldown.get(person.track_id, 0)
                if _now - last > INTRUSION_COOLDOWN_SEC:
                    _intrusion_cooldown[person.track_id] = _now
                    alert = AlertEvent(
                        camera_id=self._camera_id,
                        alert_type="intrusion",
                        message=f"Person entered restricted area: {violated_zone.name}",
                        severity="high",
                        metadata={
                            "zone_id":   violated_zone.zone_id,
                            "zone_name": violated_zone.name,
                            "track_id":  person.track_id,
                        },
                    )
                    await publisher.publish_alert(alert)

        # ── Crowd detection ───────────────────────────────────────────────────
        crowd_alert = crowd_detector.update(len(people))
        if crowd_alert:
            alert = AlertEvent(
                camera_id=self._camera_id,
                alert_type="crowd",
                message=f"Too much crowd detected ({len(people)} people)",
                severity="medium",
                metadata={"count": len(people), "threshold": settings.crowd_threshold},
            )
            await publisher.publish_alert(alert)

        # ── Abnormal activity (sampled) ───────────────────────────────────────
        if _now - self._last_abnormal_check >= settings.abnormal_check_interval:
            self._last_abnormal_check = _now
            asyncio.create_task(self._check_abnormal(frame))

        # ── Publish detection event ───────────────────────────────────────
        event = DetectionEvent(
            camera_id=self._camera_id,
            frame_id=frame_id,
            people=people,
            vehicles=vehicles,
            people_count=len(people),
            vehicle_count=len(vehicles),
            crowd_detected=crowd_alert,
        )
        await publisher.publish_detection(event)

    async def _check_abnormal(self, frame: np.ndarray) -> None:
        result = await detect_abnormal_activity(frame)
        if result and result.get("detected"):
            desc = result.get("description") or "Abnormal activity detected"
            alert = AlertEvent(
                camera_id=self._camera_id,
                alert_type="abnormal",
                message=desc,
                severity="high",
                metadata={"raw": result},
            )
            await publisher.publish_alert(alert)


pipeline = DetectionPipeline()