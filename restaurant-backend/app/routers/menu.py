import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/menu", tags=["Menu"])

# ======================================================
# SETUP UPLOAD DIRECTORY
# ======================================================
# Path: restaurant-backend/app/routers/menu.py -> ../../../Assets/uploads
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "..", "..", "Assets", "uploads")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


# ======================================================
# IMAGE UPLOAD (SAVES TO ASSETS/UPLOADS)
# ======================================================
@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # Generate unique filename to avoid overwriting
    file_extension = file.filename.split(".")[-1]
    new_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, new_filename)

    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # This path is relative to the root for the frontend to consume
        return {"url": f"Assets/uploads/{new_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")


# ======================================================
# READ (GROUPED FOR FRONTEND)
# ======================================================
@router.get("/")
def get_menu(db: Session = Depends(get_db)):
    items = db.query(models.MenuItem).all()

    result = {}
    for item in items:
        # Avoid crash if category is missing
        cat = item.category.name if item.category else "Uncategorized"
        result.setdefault(cat, []).append({
            "id": item.id,
            "title": item.title,
            "desc": item.description,
            "price": item.price,
            "image": item.image_url
        })

    return result


# ======================================================
# CREATE
# ======================================================
@router.post("/")
def create_menu(
        menu: schemas.MenuCreate,
        db: Session = Depends(get_db)
):
    # Find or create category
    category = db.query(models.MenuCategory).filter(
        models.MenuCategory.name == menu.category
    ).first()

    if not category:
        category = models.MenuCategory(name=menu.category)
        db.add(category)
        db.commit()
        db.refresh(category)

    item = models.MenuItem(
        title=menu.title,
        description=menu.desc,  # Now correctly mapping 'desc' from schema
        price=menu.price,
        image_url=menu.image_url,
        category_id=category.id
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return {"status": "created", "id": item.id}


# ======================================================
# UPDATE
# ======================================================
@router.put("/{menu_id}")
def update_menu(
        menu_id: int,
        menu: schemas.MenuCreate,
        db: Session = Depends(get_db)
):
    item = db.query(models.MenuItem).filter(
        models.MenuItem.id == menu_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    category = db.query(models.MenuCategory).filter(
        models.MenuCategory.name == menu.category
    ).first()

    if not category:
        category = models.MenuCategory(name=menu.category)
        db.add(category)
        db.commit()
        db.refresh(category)

    item.title = menu.title
    item.description = menu.desc
    item.price = menu.price
    item.image_url = menu.image_url
    item.category_id = category.id

    db.commit()
    return {"status": "updated"}


# ======================================================
# DELETE
# ======================================================
@router.delete("/{menu_id}")
def delete_menu(
        menu_id: int,
        db: Session = Depends(get_db)
):
    item = db.query(models.MenuItem).filter(
        models.MenuItem.id == menu_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    db.delete(item)
    db.commit()
    return {"status": "deleted"}