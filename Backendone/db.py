import os, psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()  # ← this reads your .env file

DATABASE_URL = os.environ["DATABASE_URL"]

def get_db():
    # connect_timeout: fail fast instead of hanging a worker when the
    # database is slow to accept connections (e.g. cold start / far region).
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row, connect_timeout=10)
    return conn