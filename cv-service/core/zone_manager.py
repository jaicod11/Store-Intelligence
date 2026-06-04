from shapely.geometry import Point, Polygon
from schemas.events import ZoneConfig
from utils.video_utils import get_centroid


class ZoneManager:
    """Manages restricted ROI zones and checks for intrusions."""

    def __init__(self):
        self._zones: dict[str, ZoneConfig] = {}

    def add_zone(self, zone: ZoneConfig) -> None:
        self._zones[zone.zone_id] = zone

    def remove_zone(self, zone_id: str) -> bool:
        if zone_id in self._zones:
            del self._zones[zone_id]
            return True
        return False

    def list_zones(self) -> list[ZoneConfig]:
        return list(self._zones.values())

    def get_zone(self, zone_id: str) -> ZoneConfig | None:
        return self._zones.get(zone_id)

    def check_intrusion(
        self, bbox: list[float], camera_id: str = "cam1"
    ) -> ZoneConfig | None:
        """
        Returns the first zone that the bbox centroid falls inside,
        or None if no intrusion.
        """
        cx, cy = get_centroid(bbox)
        point = Point(cx, cy)

        for zone in self._zones.values():
            if zone.camera_id != camera_id:
                continue
            polygon = Polygon(zone.points)
            if polygon.is_valid and polygon.contains(point):
                return zone

        return None

    def check_all_intrusions(
        self, bboxes: list[list[float]], camera_id: str = "cam1"
    ) -> list[tuple[list[float], ZoneConfig]]:
        """
        Check multiple bboxes. Returns list of (bbox, violated_zone) pairs.
        """
        violations = []
        for bbox in bboxes:
            zone = self.check_intrusion(bbox, camera_id)
            if zone:
                violations.append((bbox, zone))
        return violations


zone_manager = ZoneManager()