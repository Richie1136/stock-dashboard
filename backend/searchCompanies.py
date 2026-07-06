from flask import Flask, jsonify, request, Blueprint
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests

app = Flask(__name__)
CORS(app)

load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY').strip()

search_companies_bp = Blueprint("search_companies", __name__)


@search_companies_bp.route("/api/search", methods=["GET"])
def search_companies():
    headers = {
        "X-Finnhub-Token": API_KEY
    }
    search_term = request.args.get("query")
    search_url = (f"https://finnhub.io/api/v1/search?q={search_term}")
    search_response = requests.get(search_url, headers=headers)
    search_data = search_response.json()
    return jsonify(search_data)