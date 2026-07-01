from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    redis_url: str = "redis://localhost:6379"

    video_source: str = "../videos/sample.mp4"
    yolo_model: str = "yolov8n.pt"
    crowd_threshold: int = 10
    abnormal_check_interval: int = 5
    gender_cache_ttl: int = 30
    frame_skip: int = 2

    # NEW — dwell / loitering tracking
    loitering_threshold_sec: int = 90   # seconds before a person is "loitering"
    dwell_exit_grace_sec: int = 5       # seconds of absence before a track is considered "exited"

    person_class_id: int = 0

    class Config:
        env_file = (".env", "../.env")
        extra = "ignore"


settings = Settings()