from sqlmodel import create_engine, Session, SQLModel
from .config import settings

engine = create_engine(settings.DATABASE_URL)

import time
from sqlalchemy.exc import OperationalError

def init_db():
    retries = 10
    while retries > 0:
        try:
            SQLModel.metadata.create_all(engine)
            break
        except OperationalError:
            retries -= 1
            print(f"Database not ready, retrying... ({retries} retries left)")
            time.sleep(2)

def get_session():
    with Session(engine) as session:
        yield session
