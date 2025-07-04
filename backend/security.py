from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_frontend_role(db_role: str) -> str:
    """Normalizes the database role to 'admin' or 'user' for frontend."""
    if db_role.lower() == 'admin':
        return 'admin'
    return 'user' # Any other role (Rep, Manager, etc.) is considered 'user' for frontend
