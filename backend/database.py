from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./physiotwin.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def apply_sqlite_migrations():
    """
    Ensures newly added columns exist in existing SQLite database tables without requiring manual migration tools.
    """
    with engine.connect() as conn:
        # Check users table columns
        try:
            res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            user_cols = [row[1] for row in res]
            if len(user_cols) > 0:
                if "hevy_api_key_encrypted" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN hevy_api_key_encrypted TEXT"))
                if "google_health_refresh_token_encrypted" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN google_health_refresh_token_encrypted TEXT"))
                conn.commit()
        except Exception as e:
            print(f"Migration error (users): {e}")

        # Check nutrition_logs table columns
        try:
            res = conn.execute(text("PRAGMA table_info(nutrition_logs)")).fetchall()
            nutri_cols = [row[1] for row in res]
            if len(nutri_cols) > 0:
                if "micros_json" not in nutri_cols:
                    conn.execute(text("ALTER TABLE nutrition_logs ADD COLUMN micros_json TEXT"))
                if "raw_data" not in nutri_cols:
                    conn.execute(text("ALTER TABLE nutrition_logs ADD COLUMN raw_data TEXT"))
                conn.commit()
        except Exception as e:
            print(f"Migration error (nutrition_logs): {e}")

# Apply table schema updates
apply_sqlite_migrations()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
