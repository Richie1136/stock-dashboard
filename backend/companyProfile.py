from flask import jsonify, Blueprint
from dotenv import load_dotenv
import os
import requests


load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY', "").strip()

company_profile_cache = {}

company_profile_bp = Blueprint("company_profile", __name__)

@company_profile_bp.route("/api/company/<symbol>", methods=['GET'])
def company(symbol):
    symbol = symbol.strip().upper()

    if not symbol:
        return jsonify({"error": "A stock symbol is required"}), 400

    headers = {
        "X-Finnhub-Token": API_KEY
    }

  # Use that symbol to get profile data
    profile_url = (f"https://finnhub.io/api/v1/stock/profile2?symbol={symbol}")
    if symbol in company_profile_cache:
        print("FINNHUB COMPANY PROFILE CACHE HIT", symbol)
        return jsonify(company_profile_cache[symbol])
    profile_response = requests.get(profile_url, headers=headers, timeout=10)

    if profile_response.status_code != 200:
        return jsonify({
            "error": "Finnhub request failed",
            "status": profile_response.status_code,
            "details": profile_response.text
        }), profile_response.status_code

    profile_data = profile_response.json()

    if not profile_data:
        return jsonify({
            "error": f"No company profile found for {symbol}"
        })
    company_profile_cache[symbol] = profile_data


    return jsonify(profile_data)



VANTAGE_API_KEY= os.getenv('ALPHAVANTAGE_API_KEY', "").strip()

fund_etf_profile_bp = Blueprint("fund_etf_profile", __name__)

etf_profile_cache = {}


@fund_etf_profile_bp.route("/api/etf/<symbol>", methods=["GET"])
def fund_etf_profile(symbol):
    symbol = symbol.strip().upper()
    if symbol in etf_profile_cache:
        return jsonify(etf_profile_cache[symbol])
    search_url = (f"https://www.alphavantage.co/query?function=ETF_PROFILE&symbol={symbol}&apikey={VANTAGE_API_KEY}")
    search_response = requests.get(search_url, timeout=10)

    if not search_response.ok:
        return jsonify({
            "error": "Profile data request failed"
        }), search_response.status_code 


    profile_data = search_response.json()

    if "Information" in profile_data:
        return jsonify({
            "error": "ETF Profile rate limit has been hit"
        }), 429

    if not profile_data:
        return jsonify({
            "error": "No ETF profile data returned"
        }),404
    etf_profile_cache[symbol] = profile_data
    return jsonify(profile_data)

fund_mutual_fund_profile_bp = Blueprint("fund_mutual_fund_profile", __name__)

BUSINESS_QUANT_API_KEY= os.getenv('BUSINESS_QUANT_API_KEY', "").strip()

mutual_fund_profile_cache = {}

@fund_mutual_fund_profile_bp.route("/api/mutual-fund/<symbol>", methods=["GET"])
def fund_mutual_fund_profile_(symbol):
    symbol = symbol.strip().upper()
    if symbol in mutual_fund_profile_cache:
        print("BUSINESS QUANT PROFILE CACHE HIT:", symbol)

        return jsonify(mutual_fund_profile_cache[symbol])
    search_url = (f"https://data.businessquant.com/funds/profile?ticker={symbol}&api_key={BUSINESS_QUANT_API_KEY}")
    search_response = requests.get(search_url, timeout=10)

    if not search_response.ok:
        return jsonify({
            "error": "Profile data request failed"
        }), search_response.status_code 


    profile_data = search_response.json()

    mutual_fund_profile_cache[symbol] = profile_data
    return jsonify(profile_data)