# populate_departments.py
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Department # Import Base and Department models

# Ensure tables are created if they don't exist
Base.metadata.create_all(bind=engine)

def populate_departments():
    db: Session = SessionLocal()
    try:
        # Define departments to add
        departments_to_add = [
            "HR",
            "IT",
            "Sales",
            "Marketing",
            "Finance",
            "Operations",
            "Customer Service",
            "Research & Development",
            "Legal"
        ]

        # Check if departments already exist to avoid duplicates
        existing_departments = db.query(Department.name).all()
        existing_department_names = {d[0] for d in existing_departments}

        new_departments_count = 0
        for dept_name in departments_to_add:
            if dept_name not in existing_department_names:
                new_dept = Department(name=dept_name)
                db.add(new_dept)
                new_departments_count += 1
                print(f"Adding department: {dept_name}")
            else:
                print(f"Department '{dept_name}' already exists. Skipping.")

        if new_departments_count > 0:
            db.commit()
            print(f"Successfully added {new_departments_count} new departments.")
        else:
            print("No new departments to add. All defined departments already exist.")

    except Exception as e:
        db.rollback()
        print(f"An error occurred during department population: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Populating initial departments...")
    populate_departments()
    print("Department population complete.")
