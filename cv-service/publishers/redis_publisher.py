import redis.asyncio as aioredis
import json
from config import settings
from schemas.events import DetectionEvent, AlertEvent
import logging

logger = logging.getLogger(__name__)

CHANNEL_DETECTIONS = "store:detections"
CHANNEL_ALERTS = "store:alerts"


class RedisPublisher:
    def __init__(self):
        self._client: aioredis.Redis | None = None

    async def connect(self) -> None:
        self._client = await aioredis.from_url(
            settings.redis_url, decode_responses=True
        )
        logger.info("Redis publisher connected.")

    async def disconnect(self) -> None:
        if self._client:
            await self._client.aclose()

    async def publish_detection(self, event: DetectionEvent) -> None:
        if not self._client:
            return
        payload = event.model_dump(mode="json")
        await self._client.publish(CHANNEL_DETECTIONS, json.dumps(payload))

    async def publish_alert(self, event: AlertEvent) -> None:
        if not self._client:
            return
        payload = event.model_dump(mode="json")
        await self._client.publish(CHANNEL_ALERTS, json.dumps(payload))
        logger.info(f"Alert published: [{event.alert_type}] {event.message}")


publisher = RedisPublisher()