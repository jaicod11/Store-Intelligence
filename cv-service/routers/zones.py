from fastapi import APIRouter, HTTPException
from schemas.events import ZoneConfig
from core.zone_manager import zone_manager

router = APIRouter(prefix="/zones", tags=["zones"])


@router.post("/", status_code=201)
def create_zone(zone: ZoneConfig):
    zone_manager.add_zone(zone)
    return {"message": "Zone created", "zone_id": zone.zone_id}


@router.get("/")
def list_zones():
    return zone_manager.list_zones()


@router.get("/{zone_id}")
def get_zone(zone_id: str):
    zone = zone_manager.get_zone(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


@router.delete("/{zone_id}")
def delete_zone(zone_id: str):
    deleted = zone_manager.remove_zone(zone_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Zone not found")
    return {"message": "Zone deleted"}