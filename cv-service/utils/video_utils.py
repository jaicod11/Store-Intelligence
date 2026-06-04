import cv2
import numpy as np
from PIL import Image
import base64
from io import BytesIO


def open_video_source(source: str) -> cv2.VideoCapture:
    """Open a video file or RTSP stream."""
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video source: {source}")
    return cap


def get_video_meta(cap: cv2.VideoCapture) -> dict:
    return {
        "fps": cap.get(cv2.CAP_PROP_FPS),
        "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        "total_frames": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
    }


def crop_bbox(frame: np.ndarray, bbox: list[float], padding: int = 10) -> np.ndarray:
    """Crop a bounding box region from a frame with optional padding."""
    h, w = frame.shape[:2]
    x1, y1, x2, y2 = [int(v) for v in bbox]
    x1 = max(0, x1 - padding)
    y1 = max(0, y1 - padding)
    x2 = min(w, x2 + padding)
    y2 = min(h, y2 + padding)
    return frame[y1:y2, x1:x2]


def frame_to_base64(frame: np.ndarray) -> str:
    """Convert an OpenCV frame to a base64-encoded JPEG string."""
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)
    buf = BytesIO()
    pil_img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def get_centroid(bbox: list[float]) -> tuple[float, float]:
    """Return (cx, cy) centroid of a bounding box."""
    x1, y1, x2, y2 = bbox
    return ((x1 + x2) / 2, (y1 + y2) / 2)