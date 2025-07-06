from backend.models import Permission, Survey, Department
from backend.database import SessionLocal
from datetime import datetime

import logging

def populate_surveys_from_permissions():
    db = SessionLocal()
    created_count = 0
    deleted_count = 0
    try:
        # 1. Get all valid permission pairs
        permissions = db.query(Permission).all()
        valid_pairs = set((perm.to_dept_id, perm.from_dept_id) for perm in permissions)

        # 2. Get all existing survey pairs
        surveys = db.query(Survey).all()
        survey_pairs = set((survey.rated_department_id, survey.managing_department_id) for survey in surveys)

        # 3. Find surveys to delete (no longer permitted)
        to_delete = [survey for survey in surveys
                     if (survey.rated_department_id, survey.managing_department_id) not in valid_pairs]
        for survey in to_delete:
            db.delete(survey)
            deleted_count += 1

        # 4. Add new surveys for new permissions
        for perm in permissions:
            pair = (perm.to_dept_id, perm.from_dept_id)
            if pair not in survey_pairs:
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
        print(f"Surveys populated based on permissions. {created_count} surveys created, {deleted_count} surveys deleted.")
        return created_count
    except Exception as e:
        db.rollback()
        logging.error(f"Error populating surveys from permissions: {e}", exc_info=True)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    populate_surveys_from_permissions()