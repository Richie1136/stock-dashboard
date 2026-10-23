from flask import jsonify, Blueprint
from datetime import date
import yfinance as yf
import pandas as pd
import time


company_earnings_calendar_cache = {}

company_earnings_calendar_bp = Blueprint("company_earnings_calendar", __name__)

@company_earnings_calendar_bp.route("/api/company-earnings/<symbol>", methods=['GET'])
def company_earnings_calendar(symbol):
    symbol = symbol.strip().upper()
    today = date.today()
    if not symbol:
        return jsonify({"error": "A stock symbol is required"}), 400

    # Retrieve earnings dates from Yahoo Finance
    try:
        cached = company_earnings_calendar_cache.get(symbol)
        if cached and time.time() - cached['timestamp'] < 3600:
            print("COMPANY Earnings CACHE HIT:", symbol)
            return jsonify(cached['data'])
        ticker = yf.Ticker(symbol)
        earnings_date = ticker.get_earnings_dates(limit=8)
    except Exception as e:
        print("Yahoo Finance earnings error:", e)
        return jsonify({
            "error": "Unable to retrieve company earnings"
        }), 502
    
    if earnings_date is None or earnings_date.empty:
        return jsonify({"upcoming": None, "history": []})
    
    # Sort earnings dates from oldest to newest

    earnings_date = earnings_date.sort_index()
    
    # Find the next upcoming earnings
    upcoming = None

    for date_value, row in earnings_date.iterrows():
        if date_value.date() > today:
            upcoming = {
                "date": date_value.strftime("%Y-%m-%d"),
                "estimated_eps": (
                    None if pd.isna(row['EPS Estimate'])
                    else float(row['EPS Estimate'])
                )
            }
            break
    
    # Existing historical earnings loop
    history = []

    for date_value, row in earnings_date.iterrows():
        if date_value.date() >= today:
            continue

        history.append({
            "date": date_value.strftime("%Y-%m-%d"),
            "estimated_eps": None if pd.isna(row["EPS Estimate"]) else float(row["EPS Estimate"]),
            "actual_eps": None if pd.isna(row['Reported EPS']) else float(row['Reported EPS']),
            "surprise_percent": None if pd.isna(row['Surprise(%)']) else float(row['Surprise(%)'])
        })

    result = {
        "upcoming": upcoming,
        "history": history[-4:]
    }

    company_earnings_calendar_cache[symbol] = {
        "data": result,
        "timestamp": time.time()
    }

    return jsonify(result)