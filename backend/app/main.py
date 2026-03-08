from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .routes import router
from .auth_routes import router as auth_router
from .doctor_routes import router as doctor_router

app = FastAPI(title="Medifix API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(doctor_router)
app.include_router(router)


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
