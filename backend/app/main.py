from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .routes import router
from .auth_routes import router as auth_router
from .doctor_routes import router as doctor_router
from .dentist_routes import router as dentist_router
from .lab_routes import router as lab_router
from .ambulance_routes import router as ambulance_router
from .nurse_routes import router as nurse_router
from .physiotherapist_routes import router as physiotherapist_router
from .pharmacy_routes import router as pharmacy_router
from .user_routes import router as user_router
from .settings_routes import router as settings_router
from .content_routes import router as content_router

app = FastAPI(title="Medifix API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(doctor_router)
app.include_router(dentist_router)
app.include_router(lab_router)
app.include_router(ambulance_router)
app.include_router(nurse_router)
app.include_router(physiotherapist_router)
app.include_router(pharmacy_router)
app.include_router(settings_router)
app.include_router(content_router)
app.include_router(router)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
