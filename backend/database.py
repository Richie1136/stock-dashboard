import sqlite3
from pathlib import Path
import os

# Store the database in the backend directory
DB_PATH = Path(os.getenv("DB_FILE", Path(__file__).resolve().parent / "stock_dashboard.db"))


def get_db_connection():
    # Connect to the SQLite database
    conn = sqlite3.connect(DB_PATH)

    # Allow us to access columns by name
    conn.row_factory = sqlite3.Row

    return conn

def initialize_database():
    # Establish a connection to SQLite
    with get_db_connection() as conn:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute("""
CREATE TABLE IF NOT EXISTS price_history_cache (
                     symbol TEXT PRIMARY KEY,
                     data TEXT NOT NULL,
                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                     source TEXT
                     )
""")
        columns = conn.execute("PRAGMA table_info(price_history_cache)")
        if "source" not in {column["name"] for column in columns}:
            conn.execute("ALTER TABLE price_history_cache ADD COLUMN source TEXT")

if __name__ == "__main__":
    initialize_database()
    print("SQLite database initialized successfully!")