from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    gemini_api_key: str
    redis_url: str = "redis://localhost:6379"

    video_source: str = "../videos/sample.mp4"
    yolo_model: str = "yolov8n.pt"
    crowd_threshold: int = 10
    abnormal_check_interval: int = 5
    gender_cache_ttl: int = 30
    frame_skip: int = 2

    # YOLO COCO class ID for person only
    person_class_id: int = 0

    class Config:
        env_file = (".env", "../.env")
        extra = "ignore"


settings = Settings()