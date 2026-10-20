from flask import jsonify, Blueprint
from dotenv import load_dotenv
import os
import requests
from datetime import date, timedelta

load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY', "").strip()

company_earnings_calendar_cache = {}

company_earnings_calendar_bp = Blueprint("company_earnings_calendar", __name__)

@company_earnings_calendar_bp.route("/api/company-earnings/<symbol>", methods=['GET'])
def company_earnings_calendar(symbol):
    symbol = symbol.strip().upper()
    today = date.today()
    thirtyDaysAfter = today + timedelta(days=30)

    if not symbol:
        return jsonify({"error": "A stock symbol is required"}), 400

    headers = {
        "X-Finnhub-Token": API_KEY
    }

    # Query the next 30 days on a cache miss; cached results last for this process.
    try:
        if symbol in company_earnings_calendar_cache:
            print("COMPANY Earnings CACHE HIT:", symbol)
            return jsonify(company_earnings_calendar_cache[symbol])
        company_earnings_calender_url = (f"https://finnhub.io/api/v1/calendar/earnings?from={today}&to={thirtyDaysAfter}&symbol={symbol}")
        company_earnings_calender_response = requests.get(company_earnings_calender_url, headers=headers, timeout=20)
    except requests.exceptions.Timeout:
        return jsonify({
            "error": "Finnhub company earnings request timed out"
        }), 504

    if company_earnings_calender_response.status_code != 200:
        return jsonify({
            "error": "Finnhub request failed",
            "status": company_earnings_calender_response.status_code,
            "details": company_earnings_calender_response.text
        }), company_earnings_calender_response.status_code

    company_earnings_calender_data = company_earnings_calender_response.json()
    if not company_earnings_calender_data:
        return jsonify([])
    company_earnings_calendar_cache[symbol] = company_earnings_calender_data

    return jsonify(company_earnings_calender_data)