import os, psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()  # ← this reads your .env file

DATABASE_URL = os.environ["DATABASE_URL"]

def get_db():
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    return conn