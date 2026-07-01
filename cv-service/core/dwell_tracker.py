"""
Tracks how long each ByteTrack track_id has been continuously visible.

Two things fall out of this single data structure:
1. Loitering — fires once when a track crosses loitering_threshold_sec.
2. Avg dwell time — when a track disappears for longer than
   dwell_exit_grace_sec, we finalize their total dwell duration and
   publish it for the API service to average across the day.
"""

from config import settings


class DwellTracker:
    def __init__(self, loitering_threshold_sec: int, exit_grace_sec: int):
        self.loitering_threshold_sec = loitering_threshold_sec
        self.exit_grace_sec = exit_grace_sec

        self._first_seen: dict[int, float] = {}
        self._last_seen: dict[int, float] = {}
        self._loitering_alerted: set[int] = set()

    def update(self, active_track_ids: list[int], now: float) -> dict:
        """
        Call once per processed frame with the currently-detected track IDs.

        Returns:
            {
              "loitering_tracks": [track_id, ...],
              "exited_tracks": [(track_id, dwell_seconds), ...]
            }
        """
        loitering_tracks: list[int] = []
        exited_tracks: list[tuple[int, float]] = []

        active_set = set(active_track_ids)

        for tid in active_track_ids:
            if tid not in self._first_seen:
                self._first_seen[tid] = now
            self._last_seen[tid] = now

            dwell = now - self._first_seen[tid]
            if dwell >= self.loitering_threshold_sec and tid not in self._loitering_alerted:
                self._loitering_alerted.add(tid)
                loitering_tracks.append(tid)

        stale_ids = [
            tid for tid, last in self._last_seen.items()
            if tid not in active_set and (now - last) > self.exit_grace_sec
        ]
        for tid in stale_ids:
            dwell = self._last_seen[tid] - self._first_seen[tid]
            exited_tracks.append((tid, dwell))
            del self._first_seen[tid]
            del self._last_seen[tid]
            self._loitering_alerted.discard(tid)

        return {"loitering_tracks": loitering_tracks, "exited_tracks": exited_tracks}

    def reset(self) -> None:
        self._first_seen.clear()
        self._last_seen.clear()
        self._loitering_alerted.clear()


dwell_tracker = DwellTracker(
    loitering_threshold_sec=settings.loitering_threshold_sec,
    exit_grace_sec=settings.dwell_exit_grace_sec,
)