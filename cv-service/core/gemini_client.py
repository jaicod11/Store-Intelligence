import google.generativeai as genai
import asyncio
import time
import numpy as np
from config import settings
from utils.video_utils import frame_to_base64, crop_bbox
import logging

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.gemini_api_key)
_model = genai.GenerativeModel("gemini-2.0-flash")

# Cache: track_id → {"gender": str, "expires_at": float}
_gender_cache: dict[int, dict] = {}

GENDER_PROMPT = (
    "Look at this person in the image. Respond with exactly one word: "
    "'male' or 'female'. No other text."
)

ABNORMAL_PROMPT = (
    "Analyze this surveillance camera frame. Does it show any of the following: "
    "accident, fight, fall, medical emergency, or any clearly abnormal or dangerous activity? "
    "Respond with a JSON object: "
    '{"detected": true/false, "description": "brief description or null"}. '
    "No markdown, just raw JSON."
)


async def detect_gender(frame: np.ndarray, bbox: list[float], track_id: int) -> str | None:
    """
    Returns 'male', 'female', or None.
    Results are cached per track_id for GENDER_CACHE_TTL seconds.
    """
    now = time.time()
    cached = _gender_cache.get(track_id)
    if cached and cached["expires_at"] > now:
        return cached["gender"]

    try:
        crop = crop_bbox(frame, bbox)
        if crop.size == 0:
            return None

        b64 = frame_to_base64(crop)
        image_part = {"mime_type": "image/jpeg", "data": b64}

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: _model.generate_content([GENDER_PROMPT, image_part])
        )

        raw = response.text.strip().lower()
        gender = raw if raw in ("male", "female") else None

        _gender_cache[track_id] = {
            "gender": gender,
            "expires_at": now + settings.gender_cache_ttl,
        }
        return gender

    except Exception as e:
        logger.warning(f"Gender detection failed for track {track_id}: {e}")
        return None


async def detect_abnormal_activity(frame: np.ndarray) -> dict | None:
    """
    Returns {"detected": bool, "description": str|None} or None on error.
    """
    import json

    try:
        b64 = frame_to_base64(frame)
        image_part = {"mime_type": "image/jpeg", "data": b64}

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: _model.generate_content([ABNORMAL_PROMPT, image_part])
        )

        raw = response.text.strip()
        result = json.loads(raw)
        return result

    except Exception as e:
        logger.warning(f"Abnormal activity detection failed: {e}")
        return None


def clear_gender_cache() -> None:
    """Prune expired cache entries."""
    now = time.time()
    expired = [k for k, v in _gender_cache.items() if v["expires_at"] <= now]
    for k in expired:
        del _gender_cache[k]