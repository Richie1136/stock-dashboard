from flask import jsonify, request, Blueprint
from dotenv import load_dotenv
import os
import requests
import time

load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY', "").strip()

ALPHA_VANTAGE_KEY = os.getenv("ALPHAVANTAGE_API_KEY", "").strip()

search_companies_bp = Blueprint("search_companies", __name__)

search_cache = {}

@search_companies_bp.route("/api/search", methods=["GET"])
def search_companies():
    print("ROUTE HIT:", request.args.get("query"), time.time())
    headers = {
        "X-Finnhub-Token": API_KEY
    }
    search_term = request.args.get("query", "").strip().lower()
    explicit_search = request.args.get("explicit") == "true"
    print("EXPLICIT SEARCH:", explicit_search)
    search_url = (f"https://finnhub.io/api/v1/search?q={search_term}")
    
    if search_term in search_cache:
        return jsonify(search_cache[search_term])
    print("CALLING FINNHUB", search_term, time.time())
    search_response = requests.get(search_url, headers=headers, timeout=10)

    if not search_response.ok:
        return jsonify({
            "error": "Finnhub search request failed"
        }), search_response.status_code   
    search_data = search_response.json()

    if search_data['result']:
            search_cache[search_term] = search_data
            return jsonify(search_data)
    
    if not explicit_search:
         return jsonify(search_data)


    url = (
        "https://www.alphavantage.co/query"
        f"?function=SYMBOL_SEARCH"
        f"&keywords={search_term}"
        f"&apikey={ALPHA_VANTAGE_KEY}"
        )

    response = requests.get(url, timeout=10)
    alpha_data = response.json()

    print("ALPHA DATA:", alpha_data)

    if "Information" in alpha_data:
         return jsonify({
              "count": 0,
              "result": []
         })
    

    if "bestMatches" not in alpha_data:
         print(alpha_data)
         return jsonify({
              "count": 0,
              "result": []
         })

    matches = alpha_data.get("bestMatches", [])

    normalized_results = []

    for match in matches:
         normalized_results.append({
              "symbol": match.get("1. symbol"),
              "displaySymbol": match.get("1. symbol"),
              "description": match.get("2. name"),
              "type": match.get("3. type")
         })

    print(url)

    normalized_data = {
         "count": len(normalized_results),
         "result": normalized_results
    }

    search_cache[search_term] = normalized_data

    return jsonify(normalized_data)