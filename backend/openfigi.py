import requests
import time
from requests.exceptions import HTTPError
from database import get_db_connection

OPENFIGI_URL = "https://api.openfigi.com/v3/mapping"

BATCH_SIZE = 10

ticker_cache = {}

def get_cached_ticker(isin):
    # Connect to our SQLite database
    with get_db_connection() as conn:

        # Search for the ISIN in our cache
        row = conn.execute(
            "SELECT ticker FROM openfigi_cache WHERE isin = ?",
            (isin,)
        ).fetchone()

    # Return the ticker if the ISIN exists in SQLite
    if row is not None:
        return True, row["ticker"]

    return False, None

def save_ticker_to_cache(isin, ticker):
    # Connect to our SQLite database
    with get_db_connection() as conn:

        # Insert a new mapping or update an existing one
        conn.execute("""
            INSERT INTO openfigi_cache (isin, ticker)
            VALUES (?, ?)
            ON CONFLICT(isin) DO UPDATE SET
                ticker = excluded.ticker,
                updated_at = CURRENT_TIMESTAMP
        """, (isin, ticker))


def get_ticker_from_isin(isin):
    payload = [
        {
            "idType": "ID_ISIN",
            "idValue": isin,
            "exchCode": "US"
        }
    ]

    response = requests.post(
        OPENFIGI_URL,
        json=payload,
        timeout=15
    )

    response.raise_for_status()

    data = response.json()

    matches = data[0].get("data", [])

    if not matches:
        return None

    return matches[0].get("ticker")

def get_tickers_in_batches(isins):
    ticker_map = {
        isin: ticker_cache[isin]
        for isin in isins
        if isin in ticker_cache
    }

    # Check SQLite for mappings not already in memory
    for isin in dict.fromkeys(isins):
        if isin not in ticker_cache:
            is_cached, cached_ticker = get_cached_ticker(isin)

            if is_cached:
                ticker_cache[isin] = cached_ticker
                ticker_map[isin] = cached_ticker

    isins = [
        isin for isin in dict.fromkeys(isins)
        if isin not in ticker_cache
    ]

    if not isins:
        return ticker_map
    
    for i in range(0, len(isins), BATCH_SIZE):
        batch = isins[i:i + BATCH_SIZE]

        for attempt in range(3):
            try:
                batch_results = get_tickers_from_isins(batch)
                break

            except HTTPError as error:
                if error.response is None or error.response.status_code != 429:
                    raise

                if attempt == 2:
                    raise

                retry_after = error.response.headers.get("Retry-After")


                wait_time = (
                    float(retry_after)
                    if retry_after
                    else 5 * (2 ** attempt)
                )

                print(f"OpenFIGI rate limit reached. Waiting {wait_time}s...")
                time.sleep(wait_time)
        ticker_map.update(batch_results)
        ticker_cache.update(batch_results)
        # Save newly retrieved ticker mappings to SQLite
        for isin, ticker in batch_results.items():
            save_ticker_to_cache(isin, ticker)
        if i + BATCH_SIZE < len(isins):
            time.sleep(6)

    return ticker_map

def get_tickers_from_isins(isins):
    payload = [
        {
            "idType": "ID_ISIN",
            "idValue": isin,
            "exchCode": "US"
        }
        for isin in isins
    ]

    response = requests.post(
        OPENFIGI_URL,
        json=payload,
        timeout=30
    )

    response.raise_for_status()

    results = response.json()

    ticker_map = {}

    for isin, result in zip(isins, results):
        matches = result.get("data", [])

        ticker_map[isin] = (
            matches[0].get("ticker")
            if matches
            else None
        )

    return ticker_map

if __name__ == "__main__":
     import time

     isins = [
            "US67066G1040",  # NVDA
            "US0378331005",  # AAPL
            "US5949181045"   # MSFT
        ]

     start_time = time.time()

     ticker_map = get_tickers_in_batches(isins)

     print("Ticker mappings:", ticker_map)
     print(f"Execution time: {time.time() - start_time:.2f} seconds")