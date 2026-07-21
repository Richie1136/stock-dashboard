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


@price_chart_bp.route("/api/price-history/<symbol>", methods=["GET"])
def price_chart(symbol):
    symbol = symbol.strip().upper()
    search_url = (f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={API_KEY}")
    search_response = requests.get(search_url, timeout=10)

    key_metrics_symbol_data = search_response.json()
    priceChartDaily = key_metrics_symbol_data.get("Time Series (Daily)", {})

    if not search_response.ok:
        return jsonify({
            "error": "ALPHAVANTAGE search request failed"
        }), search_response.status_code   
    search_data = search_response.json()
    return jsonify(search_data)