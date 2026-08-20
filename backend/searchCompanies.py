from flask import jsonify, request, Blueprint
from dotenv import load_dotenv
import os
import requests

load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY', "").strip()

search_companies_bp = Blueprint("search_companies", __name__)

@search_companies_bp.route("/api/search", methods=["GET"])
def search_companies():
    headers = {
        "X-Finnhub-Token": API_KEY
    }
    search_term = request.args.get("query")
    search_url = (f"https://finnhub.io/api/v1/search?q={search_term}")
    search_response = requests.get(search_url, headers=headers, timeout=10)

    if not search_response.ok:
        return jsonify({
            "error": "Finnhub search request failed"
        }), search_response.status_code   
    search_data = search_response.json()
    return jsonify(search_data)