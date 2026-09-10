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
        # Check nutrition_logs
        try:
            res = conn.execute(text("PRAGMA table_info(nutrition_logs)")).fetchall()
            cols = [row[1] for row in res]
            if len(cols) > 0:
                for col_def in [
                    ("food_id", "TEXT"), ("food_name", "TEXT"), ("meal_type", "TEXT DEFAULT 'Lunch'"),
                    ("items_json", "TEXT"), ("quantity", "REAL DEFAULT 1.0"), ("serving_unit", "TEXT DEFAULT 'serving'"),
                    ("fiber_g", "REAL DEFAULT 0.0"), ("sodium_mg", "REAL DEFAULT 0.0"), ("micros_json", "TEXT"),
                    ("image_path", "TEXT"), ("image_url", "TEXT"), ("notes", "TEXT"), ("date", "TEXT"),
                    ("logged_at", "DATETIME")
                ]:
                    if col_def[0] not in cols:
                        conn.execute(text(f"ALTER TABLE nutrition_logs ADD COLUMN {col_def[0]} {col_def[1]}"))
                conn.commit()
        except Exception as e:
            print(f"Migration notice (nutrition_logs): {e}")

        # Check workouts
        try:
            res = conn.execute(text("PRAGMA table_info(workouts)")).fetchall()
            cols = [row[1] for row in res]
            if len(cols) > 0:
                for col_def in [
                    ("template_id", "TEXT"), ("is_completed", "INTEGER DEFAULT 1"),
                    ("cover_image_path", "TEXT"), ("image_url", "TEXT"), ("total_volume_kg", "REAL DEFAULT 0.0")
                ]:
                    if col_def[0] not in cols:
                        conn.execute(text(f"ALTER TABLE workouts ADD COLUMN {col_def[0]} {col_def[1]}"))
                conn.commit()
        except Exception as e:
            print(f"Migration notice (workouts): {e}")

        # Check set_logs
        try:
            res = conn.execute(text("PRAGMA table_info(set_logs)")).fetchall()
            cols = [row[1] for row in res]
            if len(cols) > 0:
                for col_def in [
                    ("set_type", "TEXT DEFAULT 'normal'"), ("weight_kg", "REAL DEFAULT 0.0"),
                    ("rpe", "REAL"), ("completed", "INTEGER DEFAULT 1"), ("is_pr", "INTEGER DEFAULT 0"),
                    ("estimated_1rm", "REAL")
                ]:
                    if col_def[0] not in cols:
                        conn.execute(text(f"ALTER TABLE set_logs ADD COLUMN {col_def[0]} {col_def[1]}"))
                conn.commit()
        except Exception as e:
            print(f"Migration notice (set_logs): {e}")

        # Check exercises
        try:
            res = conn.execute(text("PRAGMA table_info(exercises)")).fetchall()
            cols = [row[1] for row in res]
            if len(cols) > 0:
                for col_def in [
                    ("category", "TEXT DEFAULT 'General'"), ("primary_muscle", "TEXT DEFAULT 'General'"),
                    ("secondary_muscles", "TEXT"), ("difficulty", "TEXT DEFAULT 'Intermediate'"),
                    ("tips", "TEXT"), ("icon_svg", "TEXT"), ("gif_url", "TEXT"), ("gifUrl", "TEXT")
                ]:
                    if col_def[0] not in cols:
                        conn.execute(text(f"ALTER TABLE exercises ADD COLUMN {col_def[0]} {col_def[1]}"))
                conn.commit()
        except Exception as e:
            print(f"Migration notice (exercises): {e}")

        # Check workout_exercises
        try:
            res = conn.execute(text("PRAGMA table_info(workout_exercises)")).fetchall()
            cols = [row[1] for row in res]
            if len(cols) > 0:
                if "order_index" not in cols:
                    conn.execute(text("ALTER TABLE workout_exercises ADD COLUMN order_index INTEGER DEFAULT 0"))
                conn.commit()
        except Exception as e:
            print(f"Migration notice (workout_exercises): {e}")

        # Check water_logs
        try:
            res = conn.execute(text("PRAGMA table_info(water_logs)")).fetchall()
            cols = [row[1] for row in res]
            if len(cols) > 0:
                if "updated_at" not in cols:
                    conn.execute(text("ALTER TABLE water_logs ADD COLUMN updated_at DATETIME"))
                conn.commit()
        except Exception as e:
            print(f"Migration notice (water_logs): {e}")

        # Check personal_records
        try:
            res = conn.execute(text("PRAGMA table_info(personal_records)")).fetchall()
            cols = [row[1] for row in res]
            if len(cols) > 0:
                for col_def in [
                    ("estimated_1rm_kg", "REAL DEFAULT 0.0"),
                    ("achieved_weight_kg", "REAL DEFAULT 0.0"),
                    ("achieved_reps", "INTEGER DEFAULT 0"),
                    ("achieved_date", "DATETIME")
                ]:
                    if col_def[0] not in cols:
                        conn.execute(text(f"ALTER TABLE personal_records ADD COLUMN {col_def[0]} {col_def[1]}"))
                conn.commit()
        except Exception as e:
            print(f"Migration notice (personal_records): {e}")

# Apply table schema updates
apply_sqlite_migrations()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
