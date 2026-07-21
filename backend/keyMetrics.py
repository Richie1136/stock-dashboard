from flask import Flask, jsonify, Blueprint
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests

app = Flask(__name__)
CORS(app)

load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY', "").strip()

key_metrics_bp = Blueprint("key_metrics", __name__)

@key_metrics_bp.route("/api/metrics/<symbol>", methods=['GET'])
def key_metrics(symbol):
    symbol = symbol.strip().upper()

    if not symbol:
        return jsonify({"error": "A stock symbol is required"}), 400
    
    headers = {
        "X-Finnhub-Token": API_KEY
    }

    key_metrics_symbol_url = (f"https://finnhub.io/api/v1/stock/metric?symbol={symbol}&metric=all")
    key_metrics_symbol_response = requests.get(key_metrics_symbol_url, headers=headers, timeout=10)

    if key_metrics_symbol_response.status_code != 200:
        return jsonify({
            "error": "Finnhub request failed",
            "status": key_metrics_symbol_response.status_code,
            "details": key_metrics_symbol_response.text
        }), key_metrics_symbol_response.status_code

    key_metrics_symbol_data = key_metrics_symbol_response.json()
    metrics = key_metrics_symbol_data.get("metric", {})

    if not metrics:
        return jsonify ({
            "error": f"No metrics found for {symbol}"
        }), 404

    return jsonify(metrics)