from sqlmodel import Session, SQLModel, create_engine, select

from .models import ServiceModel
from .seed import seed_services

DATABASE_URL = "sqlite:///./medifix.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        has_service = session.exec(select(ServiceModel)).first() is not None
        if not has_service:
            seed_services(session)


def get_session():
    with Session(engine) as session:
        yield session
