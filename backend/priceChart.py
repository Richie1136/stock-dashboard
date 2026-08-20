from flask import jsonify, Blueprint
from dotenv import load_dotenv
import os
import requests

load_dotenv()

API_KEY= os.getenv('ALPHAVANTAGE_API_KEY', "").strip()

price_chart_bp = Blueprint("price_chart", __name__)

price_history_cache = {}


@price_chart_bp.route("/api/price-history/<symbol>", methods=["GET"])
def price_chart(symbol):
    symbol = symbol.strip().upper()
    if symbol in price_history_cache:
        return jsonify(price_history_cache[symbol])
    search_url = (f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={API_KEY}")
    search_response = requests.get(search_url, timeout=10)
    
    if not search_response.ok:
        return jsonify({
            "error": "ALPHAVANTAGE search request failed"
        }), search_response.status_code   

    search_data = search_response.json()
    if "Time Series (Daily)" not in search_data:
        return jsonify({
            "error": "Alpha Vantage did not return price history",
            "details": search_data
        }), 429

    price_history_cache[symbol] = search_data
    return jsonify(search_data)