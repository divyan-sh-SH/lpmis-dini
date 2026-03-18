import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")

def get_conn():
    if not SUPABASE_URL:
        raise RuntimeError(
            "Missing SUPABASE_URL (or user, password, host, port, dbname) in environment"
        )
    return psycopg2.connect(SUPABASE_URL, cursor_factory=RealDictCursor)

