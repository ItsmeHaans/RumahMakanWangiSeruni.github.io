import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # Import this
from .database import engine
from .models import Base
from .routers import menu, location

Base.metadata.create_all(bind=engine)

app = FastAPI()

# MOUNT ASSETS FOLDER
# This assumes your directory is: ./Assets/ and ./restaurant-backend/app/
# We go up one level from the backend folder to find Assets
script_dir = os.path.dirname(__file__)
assets_path = os.path.join(script_dir, "../../Assets")
app.mount("/Assets", StaticFiles(directory=assets_path), name="assets")

origins = ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "null"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(menu.router)
app.include_router(location.router)

@app.get("/")
def root():
    return {"status": "ok"}