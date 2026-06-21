from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PersonDetection(BaseModel):
    track_id: int
    bbox: list[float]           # [x1, y1, x2, y2]
    confidence: float
    gender: Optional[str] = None  # "male" | "female" | None


class DetectionEvent(BaseModel):
    event_type: str = "detection"
    timestamp: datetime = Field(default_factory=utc_now)
    camera_id: str = "cam1"
    frame_id: int
    people: list[PersonDetection] = []
    people_count: int = 0
    crowd_detected: bool = False


class AlertEvent(BaseModel):
    event_type: str = "alert"
    timestamp: datetime = Field(default_factory=utc_now)
    camera_id: str = "cam1"
    alert_type: str
    message: str
    severity: str = "high"
    metadata: dict = {}


class ZoneConfig(BaseModel):
    zone_id: str
    name: str
    points: list[list[float]]
    camera_id: str = "cam1"