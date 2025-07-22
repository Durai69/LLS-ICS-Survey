from backend.database import Base, engine
from backend import models  # Import all models to register them with Base

def init_db():
    # Create all tables in the database
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")

if __name__ == "__main__":
    init_db()
