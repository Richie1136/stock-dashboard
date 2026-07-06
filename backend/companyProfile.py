from flask import Flask, jsonify, request, Blueprint
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests

app = Flask(__name__)
CORS(app)

load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY').strip()

company_profile_bp = Blueprint("company_profile", __name__)

@company_profile_bp.route("/api/company/<query>", methods=['GET'])
def company(query):
    symbol = query.upper()
    query = query.strip()
    url = (f"https://finnhub.io/api/v1/search?q={query}")
    headers = {
        "X-Finnhub-Token": API_KEY
    }
    response = requests.get(url, headers=headers)
    data = response.json()
    if not data.get("result"):
        return jsonify({"error": "No Company found"}), 404
    # Get the first matching symbol
    symbol = data["result"][0]["symbol"]

    # Use that symbol to get profile data
    profile_url = (f"https://finnhub.io/api/v1/stock/profile2?symbol={symbol}")
    profile_response = requests.get(profile_url, headers=headers)
    profile_data = profile_response.json()
    print(data)
    return jsonify(profile_data)