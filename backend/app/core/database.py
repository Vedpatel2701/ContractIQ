import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql+psycopg://"):
    db_url = "postgresql+psycopg2://" + db_url[len("postgresql+psycopg://"):]
elif db_url.startswith("postgres://"):
    db_url = "postgresql+psycopg2://" + db_url[len("postgres://"):]
elif db_url.startswith("postgresql://"):
    db_url = "postgresql+psycopg2://" + db_url[len("postgresql://"):]

is_sqlite = db_url.startswith("sqlite")

# Engine connection arguments & pooling configuration
engine_kwargs = {"echo": False}

if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production / Neon PostgreSQL connection pool settings:
    # pool_pre_ping tests connection liveness before checkout to prevent stale disconnects
    # pool_recycle refreshes connections periodically to survive serverless scale-down
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
