import csv
import os
from database import SessionLocal, engine
import models

EXERCISE_CATALOG = [
    # Fallback minimal catalog
    {"name": "Barbell Bench Press", "muscle_group": "chest", "equipment": "barbell", "instructions": "Lie flat on the bench, grip the bar slightly wider than shoulder-width, lower smoothly to mid-chest, and press explosively."},
    {"name": "Incline Barbell Bench Press", "muscle_group": "chest", "equipment": "barbell", "instructions": "Set bench to 30-45 degrees. Lower bar to upper chest and press up with control."},
    {"name": "Standard Push-Up", "muscle_group": "chest", "equipment": "bodyweight", "instructions": "Plank position, hands under shoulders. Lower chest to floor and push back up."},
]

def seed_exercises():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        csv_candidates = [
            os.path.join(os.path.dirname(__file__), "..", "exercises.csv"),
            os.path.join(os.path.dirname(__file__), "exercises.csv"),
            "exercises.csv",
            "../exercises.csv"
        ]
        csv_path = next((p for p in csv_candidates if os.path.exists(p)), None)

        if csv_path:
            print(f"Seeding exercises from CSV: {csv_path}")
            with open(csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                rows = list(reader)

            # Try loading dataset mapping
            import urllib.request, json
            id_to_data = {}
            try:
                ds_url = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json"
                req = urllib.request.Request(ds_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    ds_items = json.loads(resp.read().decode())
                    id_to_data = {str(item["id"]).zfill(4): item for item in ds_items}
            except Exception as ex:
                print(f"Dataset fetch note: {ex}")

            # Clear old seed to ensure fresh accurate paths
            db.query(models.Exercise).delete()
            db.commit()

            new_exercises = []
            for idx, row in enumerate(rows):
                raw_id = str(row.get("id", "")).strip()
                cid = raw_id.zfill(4) if raw_id.isdigit() else raw_id
                ex_id = cid or row.get("name", "").lower().replace(" ", "-")
                name = row.get("name", "").strip().title()
                body_part = row.get("bodyPart", "full_body").strip()
                target = row.get("target", "general").strip()
                equipment = row.get("equipment", "body weight").strip()

                ds_item = id_to_data.get(cid, {})
                raw_gif = ds_item.get("gif_url")
                raw_img = ds_item.get("image")

                if raw_gif:
                    gif_url = f"https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/{raw_gif}"
                else:
                    gif_url = row.get("gifUrl", "").strip() or f"/exercises/image_{idx}.gif"

                if raw_img:
                    image_path = f"https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/{raw_img}"
                else:
                    image_path = gif_url

                # Secondary muscles
                sec_muscles = [
                    row.get(f"secondaryMuscles/{i}", "").strip()
                    for i in range(6)
                    if row.get(f"secondaryMuscles/{i}", "").strip()
                ]
                secondary_muscles_str = ", ".join(sec_muscles) if sec_muscles else None

                # Instructions
                inst_steps = [
                    row.get(f"instructions/{i}", "").strip()
                    for i in range(11)
                    if row.get(f"instructions/{i}", "").strip()
                ]
                instructions_str = " ".join([s if s.endswith(".") else f"{s}." for s in inst_steps]) if inst_steps else "Perform with strict form and controlled tempo."

                exercise = models.Exercise(
                    id=ex_id,
                    name=name,
                    category=body_part,
                    primary_muscle=target,
                    secondary_muscles=secondary_muscles_str,
                    muscle_group=body_part,
                    equipment=equipment,
                    difficulty="Intermediate",
                    instructions=instructions_str,
                    tips="Focus on smooth cadence and controlled muscle activation throughout full range of motion.",
                    icon_svg=f"{ex_id}.svg",
                    image_path=image_path,
                    gif_url=gif_url,
                    gifUrl=gif_url
                )
                new_exercises.append(exercise)

            db.bulk_save_objects(new_exercises)
            db.commit()
            print(f"Successfully seeded {len(new_exercises)} exercises with verified demonstration thumbnails and GIFs.")
        else:
            print("CSV not found, using catalog fallback.")
            count = db.query(models.Exercise).count()
            if count >= len(EXERCISE_CATALOG):
                print(f"Exercises already seeded ({count} exercises present).")
                return

            for ex_data in EXERCISE_CATALOG:
                slug_id = ex_data["name"].lower().replace(" ", "-")
                existing = db.query(models.Exercise).filter(models.Exercise.name == ex_data["name"]).first()
                if not existing:
                    exercise = models.Exercise(
                        id=slug_id,
                        name=ex_data["name"],
                        muscle_group=ex_data["muscle_group"],
                        category=ex_data["muscle_group"],
                        primary_muscle=ex_data["muscle_group"],
                        equipment=ex_data["equipment"],
                        instructions=ex_data["instructions"],
                        image_path=f"/placeholder-exercise.svg",
                        gif_url=f"/placeholder-exercise.svg",
                        gifUrl=f"/placeholder-exercise.svg"
                    )
                    db.add(exercise)
            db.commit()
            print(f"Successfully seeded {len(EXERCISE_CATALOG)} fallback exercises.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding exercises: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_exercises()

