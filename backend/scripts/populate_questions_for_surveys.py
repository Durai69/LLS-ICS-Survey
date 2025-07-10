from backend.database import SessionLocal
from backend.models import Survey, Question

STANDARD_QUESTIONS = [
    ('QUALITY', 'Understands Customer needs', 'rating', 1),
    ('QUALITY', 'Provides 100% quality parts / service / information', 'rating', 2),
    ('QUALITY', 'Accepts responsibility for quality works', 'rating', 3),
    ('QUALITY', 'Eliminates repetitive complaints', 'rating', 4),
    ('DELIVERY', 'Fulfill 100% committed targets in service / information', 'rating', 5),
    ('DELIVERY', 'Delivers promptly on time', 'rating', 6),
    ('DELIVERY', 'Delivers to point of use', 'rating', 7),
    ('DELIVERY', 'Delivers usable parts / service / information', 'rating', 8),
    ('COMMUNICATION', 'Interacts with customer regularly', 'rating', 9),
    ('COMMUNICATION', 'Listens to customers views', 'rating', 10),
    ('COMMUNICATION', 'Ensures timely feedback to customers', 'rating', 11),
    ('COMMUNICATION', 'Reviews of changes with the customer', 'rating', 12),
    ('RESPONSIVENESS', 'Responds to customer complaints promptly', 'rating', 13),
    ('RESPONSIVENESS', 'Provides service when needed', 'rating', 14),
    ('RESPONSIVENESS', 'Responds quickly to changed customer needs', 'rating', 15),
    ('RESPONSIVENESS', 'Goes extra mile to help', 'rating', 16),
    ('IMPROVEMENT', 'Has a positive attitude for improvement', 'rating', 17),
    ('IMPROVEMENT', 'Implements improvement', 'rating', 18),
    ('IMPROVEMENT', 'Effectiveness of improvements', 'rating', 19),
    ('IMPROVEMENT', 'Facilitates improvements at customer end', 'rating', 20),
]

def populate_questions_for_all_surveys():
    db = SessionLocal()
    try:
        surveys = db.query(Survey).all()
        count = 0
        for survey in surveys:
            existing = db.query(Question).filter_by(survey_id=survey.id).count()
            if existing > 0:
                continue
            for cat, text, typ, order in STANDARD_QUESTIONS:
                q = Question(
                    survey_id=survey.id,
                    category=cat,
                    text=text,
                    type=typ,
                    order=order
                )
                db.add(q)
            count += 1
        db.commit()
        return count
    finally:
        db.close()