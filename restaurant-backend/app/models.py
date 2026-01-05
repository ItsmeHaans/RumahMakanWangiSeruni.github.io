from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    address = Column(String)
    hours = Column(String)
    rating = Column(Float)
    reviews = Column(Integer)
    image_url = Column(String)  # Matched to schemas
    maps_url = Column(String)  # Matched to schemas


class MenuCategory(Base):
    __tablename__ = "menu_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    items = relationship("MenuItem", back_populates="category")


class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("menu_categories.id"))
    title = Column(String)
    description = Column(String)
    price = Column(Integer)
    image_url = Column(String)

    category = relationship("MenuCategory", back_populates="items")