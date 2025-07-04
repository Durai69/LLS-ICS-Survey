# F:\LLS Survey\backend\database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

# Construct the database URL from environment variables
DATABASE_URL = (
    f"mssql+pyodbc://{os.getenv('MSSQL_USER')}:{os.getenv('MSSQL_PASSWORD')}@"
    f"{os.getenv('MSSQL_SERVER')},{os.getenv('MSSQL_PORT')}/"
    f"{os.getenv('MSSQL_DB')}?driver=ODBC+Driver+17+for+SQL+Server"
)

# Create the SQLAlchemy engine
# echo=True will print all SQL statements, useful for debugging
engine = create_engine(DATABASE_URL, echo=True)

# Create a SessionLocal class for database sessions
# Each request will get its own database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()
