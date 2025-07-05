from backend.models import Permission, Survey, Department
from backend.database import SessionLocal
from datetime import datetime

def populate_surveys_from_permissions():
    db = SessionLocal()
    created_count = 0
    try:
        permissions = db.query(Permission).all()
        for perm in permissions:
            # Check if a survey already exists for this permission
            exists = db.query(Survey).filter(
                Survey.rated_department_id == perm.to_dept_id,
                Survey.managing_department_id == perm.from_dept_id
            ).first()
            if not exists:
                rated_dept = db.query(Department).filter(Department.id == perm.to_dept_id).first()
                managing_dept = db.query(Department).filter(Department.id == perm.from_dept_id).first()
                survey = Survey(
                    title=f"Quarterly Survey for {rated_dept.name}",
                    description=f"Survey for {rated_dept.name} managed by {managing_dept.name}",
                    created_at=datetime.now(),
                    rated_department_id=perm.to_dept_id,
                    managing_department_id=perm.from_dept_id
                )
                db.add(survey)
                created_count += 1
        db.commit()
        print(f"Surveys populated based on permissions. {created_count} surveys created.")
    finally:
        db.close()

if __name__ == "__main__":
    populate_surveys_from_permissions()