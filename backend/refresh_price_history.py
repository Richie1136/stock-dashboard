from database import get_db_connection, initialize_database
from priceChart import get_price_history


def get_cached_symbols():
    with get_db_connection() as conn:
        rows = conn.execute("SELECT symbol FROM price_history_cache").fetchall()
    return [row["symbol"] for row in rows]


def refresh_cached_symbols():
    initialize_database()
    for symbol in get_cached_symbols():
        print(f"Refreshing price history for {symbol}...")
        try:
            get_price_history(symbol, force_refresh=True)
        except (RuntimeError, ValueError) as error:
            print(f"Failed to refresh {symbol}: {error}")


if __name__ == "__main__":
    refresh_cached_symbols()
