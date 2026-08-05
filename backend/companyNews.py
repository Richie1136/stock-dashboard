from flask import Flask, jsonify, Blueprint
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
from datetime import date, timedelta

app = Flask(__name__)
CORS(app)

load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY', "").strip()

today = date.today()
thirtyDaysBefore = today - timedelta(days=30)

company_news_bp = Blueprint("company_news", __name__)

@company_news_bp.route("/api/company-news/<symbol>", methods=['GET'])
def company_news(symbol):
    symbol = symbol.strip().upper()

    if not symbol:
        return jsonify({"error": "A stock symbol is required"}), 400

    headers = {
        "X-Finnhub-Token": API_KEY
    }

  # Use that symbol to get profile data
    try:

        company_news_url = (f"https://finnhub.io/api/v1/company-news?symbol={symbol}&from={thirtyDaysBefore}&to={today}")
        company_news_response = requests.get(company_news_url, headers=headers, timeout=20)
        print(company_news_url)
        print(company_news_response.status_code)
        print(company_news_response.text)
    except requests.exceptions.Timeout:
        return jsonify({
            "error": "Finnhub news request timed out"
        }), 504

    if company_news_response.status_code != 200:
        return jsonify({
            "error": "Finnhub request failed",
            "status": company_news_response.status_code,
            "details": company_news_response.text
        }), company_news_response.status_code

    company_news_data = company_news_response.json()

    if not company_news_data:
        return jsonify({
            "error": f"No company news found for {symbol}"
        })

    return jsonify(company_news_data)