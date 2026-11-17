from flask import jsonify, Blueprint, request
from dotenv import load_dotenv
import os
import requests
from yahooquery import Ticker
import json
from database import get_db_connection, initialize_database
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

load_dotenv()

BUSINESS_QUANT_API_KEY= os.getenv('BUSINESS_QUANT_API_KEY', "").strip()


price_chart_bp = Blueprint("price_chart", __name__)

PRICE_FIELDS = ["date", "open", "high", "low", "close", "volume"]
EASTERN = ZoneInfo("America/New_York")

def is_cache_stale(updated_at, price_history):
    last_updated = datetime.fromisoformat(updated_at)

    # SQLite CURRENT_TIMESTAMP stores UTC.
    last_updated = last_updated.replace(tzinfo=timezone.utc)

    last_updated_et = last_updated.astimezone(EASTERN)

    now_et = datetime.now(EASTERN)

    latest_cached_date = max(
        datetime.fromisoformat(record['date']).date()
        for record in price_history
    )

    # Determine the latest completed market session

    latest_close = now_et.replace(
        hour=17,
        minute=0,
        second=0,
        microsecond=0
    )

    # Before 5 PM, use the previous trading day.

    if now_et < latest_close:
        latest_close -= timedelta(days=1)

    # Skip weekends.

    while latest_close.weekday() >= 5:
        latest_close -= timedelta(days=1)

    return (
        last_updated_et < latest_close
        or latest_cached_date < latest_close.date()
    )

def fetch_yahoo_history(symbol, latest_date):
    history = Ticker(symbol, timeout=10, retry=0).history(period="10y", interval="1d")
    if not hasattr(history, "columns") or history.empty:
        raise ValueError("Yahoo Finance did not return daily price history")

    rows = history.reset_index().loc[:, PRICE_FIELDS].dropna(subset=["date", "close"])
    rows["date"] = rows["date"].map(lambda value: value.isoformat()[:10])
    rows = rows[rows["date"] <= latest_date].sort_values("date")
    if rows.empty:
        raise ValueError("Yahoo Finance did not return completed daily prices")

    return json.loads(rows.to_json(orient="records", double_precision=15))


def fetch_business_quant_history(symbol, latest_date):
    try:
        response = requests.get(
            "https://data.businessquant.com/quotes",
            params={
                "ticker": symbol,
                "mode": "daily",
                "period": "1y",
                "api_key": BUSINESS_QUANT_API_KEY,
            },
            timeout=10,
        )
    except requests.RequestException as error:
        raise RuntimeError("BusinessQuant price history request failed") from error
    if not response.ok:
        raise RuntimeError(f"BusinessQuant price history failed: {response.status_code}")

    data = response.json().get("data", [])
    records = [
        record for record in data
        if datetime.fromisoformat(record["date"]).date().isoformat() <= latest_date
    ]
    if not records:
        raise ValueError("BusinessQuant did not return completed daily prices")
    return records


def price_history_response(history, updated_at, from_cache, include_metadata, warning=False):
    if not include_metadata:
        return history
    refreshed_at = datetime.fromisoformat(updated_at).replace(tzinfo=timezone.utc)
    return {
        "data": history,
        "metadata": {
            "latest_price_date": max(record["date"][:10] for record in history),
            "last_refreshed_at": refreshed_at.isoformat(),
            "from_cache": from_cache,
            "warning": warning
        },
    }


def get_price_history(symbol, force_refresh=False, include_metadata=False):
    symbol = symbol.strip().upper()
    # Both providers use hyphens for Berkshire share classes.
    symbol = {"BRK.A": "BRK-A", "BRK.B": "BRK-B"}.get(symbol, symbol)
    with get_db_connection() as conn:
        cached_row = conn.execute(
            "SELECT data, updated_at, source FROM price_history_cache WHERE symbol = ?",
            (symbol,),
        ).fetchone()
    cached_history = json.loads(cached_row["data"]) if cached_row else []
    cache_is_fresh = cached_history and not is_cache_stale(
        cached_row["updated_at"], cached_history
    )
    # Skip the provider request when cached prices are fresh, unless a refresh was requested.
    # Older cache rows without a source still try Yahoo to upgrade their one-year history.
    if cache_is_fresh and cached_row["source"] and not force_refresh:
        return price_history_response(
            cached_history, cached_row["updated_at"], True, include_metadata
        )

    # Exclude today's price before 5 PM Eastern and on weekends.
    now_et = datetime.now(EASTERN)
    latest_date = now_et.date()
    if now_et.weekday() >= 5 or now_et.time() < time(17):
        latest_date -= timedelta(days=1)
    latest_date = latest_date.isoformat()

    # Yahoo is the primary provider and requests up to ten years of history.
    try:
        price_history = fetch_yahoo_history(symbol, latest_date)
        source = "yahoo"
    except Exception as error:
        # yahooquery can raise different transport and parsing errors across releases.
        print(f"Yahoo Finance price history failed for {symbol}: {type(error).__name__}")
        # Fresh saved prices are enough if Yahoo is unavailable.
        if cache_is_fresh:
            return price_history_response(
                    cached_history, cached_row["updated_at"], True, include_metadata
                )
        # Try BusinessQuant when Yahoo fails and the saved prices need updating.
        try:
            price_history = fetch_business_quant_history(symbol, latest_date)
            source = "businessquant"
        except (RuntimeError, ValueError, requests.RequestException):
            # Both providers failed. Return saved prices with their original refresh timestamp.
            if cached_history:
                return price_history_response(
                    cached_history,
                    cached_row["updated_at"],
                    True,
                    include_metadata,
                    warning=True
                )
            # With no saved prices, let the API route return its existing error response.
            raise


    # Save fetched prices only after a provider request succeeds.
    # The SQL guard protects a concurrent Yahoo update from an older fallback request.
    with get_db_connection() as conn:
        conn.execute(
            """
INSERT INTO price_history_cache (symbol, data, updated_at, source)
VALUES (?, ?, CURRENT_TIMESTAMP, ?)
ON CONFLICT(symbol) DO UPDATE SET
    data = excluded.data,
    updated_at = excluded.updated_at,
    source = excluded.source
WHERE excluded.source = 'yahoo'
   OR price_history_cache.source IS NOT 'yahoo'
   OR (price_history_cache.updated_at = ? AND price_history_cache.data = ?)
""",
            (
                symbol, json.dumps(price_history), source,
                cached_row["updated_at"] if cached_row else None,
                cached_row["data"] if cached_row else None,
            ),
        )
        updated_at = conn.execute(
            "SELECT updated_at FROM price_history_cache WHERE symbol = ?", (symbol,)
        ).fetchone()["updated_at"]
    # include_metadata adds the dates and cache flag used by the chart subtitle.
    return price_history_response(price_history, updated_at, False, include_metadata)


@price_chart_bp.route("/api/price-history/<symbol>", methods=["GET"])
def price_chart(symbol):
    try:
        price_history = get_price_history(
            symbol, include_metadata=request.args.get("include_metadata") == "true"
        )
        return jsonify(price_history)
    
    except (RuntimeError, ValueError, requests.RequestException) as error:
        print("PRICE HISTORY ERROR:", error)
        return jsonify({
            "error": str(error)
        }), 502

if __name__ == "__main__":
    initialize_database()
    price_history = get_price_history("QQQI")

    latest_record = max(
        price_history,
        key=lambda record: record["date"]
    )

    print("Latest closing price:", latest_record["close"])
    print("Latest price date:", latest_record["date"])
