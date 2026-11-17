from flask import jsonify, request, Blueprint
from dotenv import load_dotenv
import os
import requests
import time
from wait_for_alpha_vantage import wait_for_alpha_vantage
from yahooquery import search as yahoo_search

load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY', "").strip()

ALPHA_VANTAGE_KEY = os.getenv("ALPHAVANTAGE_API_KEY", "").strip()

def get_yahoo_suggestions(query):
     data = yahoo_search(query, quotes_count=10, news_count=0)

     # Translate Yahoo's asset types into the labels used by the frontend.

     asset_types = {
          "EQUITY": "Common Stock",
          "ETF": "ETP",
          "MUTUALFUND": "Mutual Fund"
     }

     symbol_map = {
          "BRK-A": "BRK.A",
          "BRK-B": "BRK.B"
     }

     results = []

     for quote in data.get("quotes", []):
          asset_type = asset_types.get(quote.get("quoteType"))
          symbol = quote.get("symbol")

          if not asset_type or not symbol:
               continue

          symbol = symbol_map.get(symbol, symbol)

          results.append({
               "symbol": symbol,
               "displaySymbol": symbol,
               "description": (
                    quote.get("longname")
                    or quote.get("shortname")
                    or symbol
               ),
               "type": asset_type
          })

     # Return after all quotes have been processed.
     return {
          "count": len(results),
          "result": results
     }

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
    
    if search_term in search_cache:
        
        print("SEARCH CACHE HIT:", search_term)
        return jsonify(search_cache[search_term])
    
    # Use Yahoo first for broader stock, ETF, and mutual-fund suggestions.

    try:
         yahoo_data = get_yahoo_suggestions(search_term)

         if yahoo_data['result']:
              search_cache[search_term] = yahoo_data
              return jsonify(yahoo_data)
         
    except Exception as error:
             # Continue to Finnhub if Yahoo search fails.
             print("Yahoo search failed:", type(error).__name__)

    # BRK represents two share classes, so search for each class explicitly.

    search_queries = ["BRK.A", "BRK.B"] if search_term == "brk" else [search_term]

    # Combine results by symbol so each suggestion appears once.

    results_by_symbol = {}

    for query in search_queries:
         search_response = requests.get("https://finnhub.io/api/v1/search",
                                        params={"q": query},
                                        headers=headers,
                                        timeout=10
                                        )
         
         if not search_response.ok:
              return jsonify({
                   "error": "Finnhub search request failed"
              }), search_response.status_code
         
         for stock in search_response.json().get("result", []):
              results_by_symbol[stock['symbol']] = stock

    results = list(results_by_symbol.values())
    
    search_data = {
          "count": len(results),
          "result": results
     }

    if search_data['result']:
          search_cache[search_term] = search_data
          return jsonify(search_data)
    
    # Reserve the Alpha Vantage fallback for submitted searches, not autocomplete.
    if not explicit_search:
         return jsonify(search_data)


    url = (
        "https://www.alphavantage.co/query"
        f"?function=SYMBOL_SEARCH"
        f"&keywords={search_term}"
        f"&apikey={ALPHA_VANTAGE_KEY}"
     )
    
     
    wait_for_alpha_vantage()
    response = requests.get(url, timeout=10)
    alpha_data = response.json()

    print("ALPHA DATA:", alpha_data)

    if "Information" in alpha_data:
         return jsonify({
              "count": 0,
              "result": []
         })
    

    if "bestMatches" not in alpha_data:
         return jsonify({
              "count": 0,
              "result": []
         })

    matches = alpha_data.get("bestMatches", [])

    # Match Finnhub's response shape so the frontend can consume either provider.
    normalized_results = []

    for match in matches:
         normalized_results.append({
              "symbol": match.get("1. symbol"),
              "displaySymbol": match.get("1. symbol"),
              "description": match.get("2. name"),
              "type": match.get("3. type")
         })

    normalized_data = {
         "count": len(normalized_results),
         "result": normalized_results
    }

    search_cache[search_term] = normalized_data

    return jsonify(normalized_data)