from pydantic import BaseModel
from typing import Optional


# ---------- LOCATION ----------
class LocationBase(BaseModel):
    name: str
    lat: float
    lng: float
    address: str
    hours: str
    rating: float
    reviews: int
    image_url: str
    maps_url: str


class LocationCreate(LocationBase):
    pass


class LocationOut(LocationBase):
    id: int

    class Config:
        from_attributes = True


# ---------- MENU ----------
class MenuBase(BaseModel):
    title: str
    desc: str
    price: int
    category: str
    image_url: Optional[str] = None


class MenuCreate(MenuBase):
    pass


class MenuOut(MenuBase):
    id: int

    class Config:
        from_attributes = True
