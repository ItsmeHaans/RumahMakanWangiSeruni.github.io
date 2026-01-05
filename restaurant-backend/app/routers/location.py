from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/locations", tags=["Locations"])


# ======================================================
# READ ALL
# ======================================================
@router.get("/", response_model=list[schemas.LocationOut])
def get_locations(db: Session = Depends(get_db)):
    return db.query(models.Location).all()


# ======================================================
# CREATE
# ======================================================
@router.post("/", response_model=schemas.LocationOut)
def create_location(
    location: schemas.LocationCreate,
    db: Session = Depends(get_db)
):
    db_location = models.Location(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location


# ======================================================
# UPDATE
# ======================================================
@router.put("/{location_id}", response_model=schemas.LocationOut)
def update_location(
    location_id: int,
    location: schemas.LocationCreate,
    db: Session = Depends(get_db)
):
    db_location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    if not db_location:
        raise HTTPException(status_code=404, detail="Location not found")

    for key, value in location.dict().items():
        setattr(db_location, key, value)

    db.commit()
    db.refresh(db_location)
    return db_location


# ======================================================
# DELETE
# ======================================================
@router.delete("/{location_id}")
def delete_location(
    location_id: int,
    db: Session = Depends(get_db)
):
    db_location = db.query(models.Location).filter(
        models.Location.id == location_id
    ).first()

    if not db_location:
        raise HTTPException(status_code=404, detail="Location not found")

    db.delete(db_location)
    db.commit()
    return {"status": "deleted"}
