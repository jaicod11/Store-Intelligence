from config import settings


class CrowdDetector:
    """
    Tracks consecutive crowd frames to avoid spamming alerts.
    An alert fires once crowd is detected and resets when crowd dissipates.
    """

    def __init__(self):
        self._threshold = settings.crowd_threshold
        self._consecutive_frames = 0
        self._consecutive_required = 3   # must persist for 3 frames to alert
        self._cooldown_frames = 30        # frames between repeated alerts
        self._cooldown_remaining = 0
        self._crowd_active = False

    def update(self, person_count: int) -> bool:
        """
        Call every frame. Returns True if a crowd alert should be raised.
        """
        if self._cooldown_remaining > 0:
            self._cooldown_remaining -= 1

        if person_count >= self._threshold:
            self._consecutive_frames += 1
        else:
            self._consecutive_frames = 0
            self._crowd_active = False

        should_alert = (
            self._consecutive_frames >= self._consecutive_required
            and not self._crowd_active
            and self._cooldown_remaining == 0
        )

        if should_alert:
            self._crowd_active = True
            self._cooldown_remaining = self._cooldown_frames

        return should_alert

    def reset(self) -> None:
        self._consecutive_frames = 0
        self._crowd_active = False
        self._cooldown_remaining = 0


crowd_detector = CrowdDetector()