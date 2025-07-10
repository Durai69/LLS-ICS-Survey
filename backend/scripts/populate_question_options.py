from backend.database import SessionLocal
from backend.models import Question, Option

def populate_question_options_for_ratings():
    db = SessionLocal()
    try:
        questions = db.query(Question).filter(Question.type == 'rating').all()
        count = 0
        for q in questions:
            # Check if options already exist for this question
            existing = db.query(Option).filter_by(question_id=q.id).count()
            if existing >= 4:
                continue
            # Create options 1-4
            for value in range(1, 5):
                text = f"{value} Star{'s' if value > 1 else ''}"
                option = Option(
                    question_id=q.id,
                    text=text,
                    value=str(value),
                    order=value
                )
                db.add(option)
            count += 1
        db.commit()
        print(f"Populated options for {count} rating questions.")
        return count
    finally:
        db.close()

if __name__ == "__main__":
    populate_question_options_for_ratings()