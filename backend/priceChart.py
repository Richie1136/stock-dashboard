from flask import Flask, jsonify, request, Blueprint
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests

app = Flask(__name__)
CORS(app)

load_dotenv()

API_KEY= os.getenv('ALPHAVANTAGE_API_KEY').strip()

price_chart_bp = Blueprint("price_chart", __name__)

price_history_cache = {}


@price_chart_bp.route("/api/price-history/<symbol>", methods=["GET"])
def price_chart(symbol):
    symbol = symbol.strip().upper()
    if symbol in price_history_cache:
        print("TTTTTTCache hit:", symbol)
        return jsonify(price_history_cache[symbol])
    search_url = (f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={API_KEY}")
    print("Calling Alpha Vantage:", symbol)
    search_response = requests.get(search_url, timeout=10)

    
    
    if not search_response.ok:
        return jsonify({
            "error": "ALPHAVANTAGE search request failed"
        }), search_response.status_code   

    search_data = search_response.json()
    if 'Time Series (Daily)' not in search_data:
        return jsonify({
            "error": "Price Chart Daily rate limit has been hit"
        }),429

    price_history_cache[symbol] = search_data
    print("Cached symbols:", price_history_cache.keys())
    return jsonify(search_data)