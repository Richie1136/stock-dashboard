import sqlite3
from pathlib import Path

# Store the database in the backend directory
DB_PATH = Path(__file__).resolve().parent / "stock_dashboard.db"


def get_db_connection():
    # Connect to the SQLite database
    conn = sqlite3.connect(DB_PATH)

    # Allow us to access columns by name
    conn.row_factory = sqlite3.Row

    return conn

def initialize_database():
    # Establish a connection to SQLite
    with get_db_connection() as conn:

        # Create a table for storing OpenFIGI ticker mappings
        conn.execute("""
            CREATE TABLE IF NOT EXISTS openfigi_cache (
                isin TEXT PRIMARY KEY,
                ticker TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

if __name__ == "__main__":
    initialize_database()
    print("SQLite database initialized successfully!")