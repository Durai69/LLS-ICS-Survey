from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User  # fixed here
from passlib.context import CryptContext
from database import Base

Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_user(db: Session, username: str, password: str, email: str, name: str, role: str, department: str):
    hashed_password = get_password_hash(password)
    user = User(
        username=username,
        hashed_password=hashed_password,
        email=email,
        name=name,
        role=role,
        department=department
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

if __name__ == "__main__":
    db = SessionLocal()
    new_user = create_user(
        db,
        username="15688779",
        password="15688779",
        email="vignesh@lls.com",
        name="Vignesh",
        role="user",
        department="mktg ia"
    )
    print(f"Created user: {new_user.username}, Email: {new_user.email}")
