from flask import Flask, jsonify, request, Blueprint
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests

app = Flask(__name__)
CORS(app)

load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY').strip()

key_metrics_bp = Blueprint("key_metrics", __name__)

@key_metrics_bp.route("/api/metrics/<symbol>", methods=['GET'])
def key_metrics(symbol):
    symbol = symbol.upper().strip()
    url = (f"https://finnhub.io/api/v1/stock/metric?symbol={symbol}&metric=all")
    headers = {
        "X-Finnhub-Token": API_KEY
    }
    response = requests.get(url, headers=headers)
    data = response.json()
    print(data.get("metric", {}).keys())
    if not data.get("metric"):
        return jsonify({"error": "No Metrics found"}), 404
    # Get the first matching symbol
    print(data)
    return jsonify(data)