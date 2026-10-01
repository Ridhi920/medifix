from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.db import init_db
from .routers.auth_routes import router as auth_router
from .routers.doctor_routes import router as doctor_router
from .routers.dentist_routes import router as dentist_router
from .routers.lab_routes import router as lab_router
from .routers.ambulance_routes import router as ambulance_router
from .routers.nurse_routes import router as nurse_router
from .routers.physiotherapist_routes import router as physiotherapist_router
from .routers.pharmacy_routes import router as pharmacy_router
from .routers.user_routes import router as user_router
from .routers.vendor_routes import router as vendor_router
from .routers.vendor_workspace_routes import router as vendor_workspace_router
from .routers.pharmacy_pos_routes import router as pharmacy_pos_router
from .routers.admin_inpatient_routes import router as admin_inpatient_router
from .routers.settings_routes import router as settings_router
from .routers.content_routes import router as content_router
from .routers.logbook_routes import router as logbook_router
from .routers.service_request_routes import router as service_request_router

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
app.include_router(vendor_router)
app.include_router(vendor_workspace_router)
app.include_router(pharmacy_pos_router)
app.include_router(admin_inpatient_router)
app.include_router(doctor_router)
app.include_router(dentist_router)
app.include_router(lab_router)
app.include_router(ambulance_router)
app.include_router(nurse_router)
app.include_router(physiotherapist_router)
app.include_router(pharmacy_router)
app.include_router(settings_router)
app.include_router(content_router)
app.include_router(logbook_router)
app.include_router(service_request_router)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
