from fastapi import APIRouter
from core.detector import pipeline
from config import settings

router = APIRouter(prefix="/stream", tags=["stream"])


@router.post("/start")
async def start_stream(source: str | None = None):
    video_source = source or settings.video_source
    if pipeline.is_running:
        return {"message": "Pipeline already running"}
    await pipeline.start(video_source)
    return {"message": "Pipeline started", "source": video_source}


@router.post("/stop")
def stop_stream():
    pipeline.stop()
    return {"message": "Pipeline stopped"}


@router.get("/status")
def stream_status():
    return {"running": pipeline.is_running}