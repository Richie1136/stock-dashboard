from flask import jsonify, Blueprint
from dotenv import load_dotenv
import os
import requests

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


mutual_fund_holdings_bp = Blueprint("mutual_fund_holdings", __name__)

BUSINESS_QUANT_API_KEY= os.getenv('BUSINESS_QUANT_API_KEY', "").strip()

@mutual_fund_holdings_bp.route("/api/mutual-fund/holdings/<symbol>", methods=['GET'])
def mutual_fund_holdings(symbol):
    symbol = symbol.strip().upper()

    if not symbol:
        return jsonify({"error": "A stock symbol is required"}), 400
    
    # if symbol in mutual_fund_profile_cache:
    #     return jsonify(mutual_fund_profile_cache[symbol])
    key_metrics_holdings_url = (f"https://data.businessquant.com/funds/holdings?ticker={symbol}&api_key={BUSINESS_QUANT_API_KEY}")
    print("KEY METRICS HOLDINGS URLLL", key_metrics_holdings_url)
    key_metrics_holdings_response = requests.get(key_metrics_holdings_url, timeout=10)
    print(key_metrics_holdings_response)

    print("Business Quant HOLDINGS URL:", key_metrics_holdings_url)

    print("Status:", key_metrics_holdings_response.status_code)
    print("Response:", key_metrics_holdings_response.text)

    if not key_metrics_holdings_response.ok:
        return jsonify({
            "error": "Profile data request failed"
        }), key_metrics_holdings_response.status_code 


    key_metrics_holdings_data = key_metrics_holdings_response.json()
    print("KEY METRICS EXPENSE RATIO DATA", key_metrics_holdings_data)

    # mutual_fund_profile_cache[symbol] = profile_data
    return jsonify(key_metrics_holdings_data)


mutual_fund_expense_ratio_bp = Blueprint("mutual_fund_expense_ratio", __name__)

@mutual_fund_expense_ratio_bp.route("/api/mutual-fund/expense-ratio/<symbol>", methods=['GET'])
def mutual_fund_expense_ratio(symbol):
    symbol = symbol.strip().upper()

    if not symbol:
        return jsonify({"error": "A stock symbol is required"}), 400
    
    # if symbol in mutual_fund_profile_cache:
    #     return jsonify(mutual_fund_profile_cache[symbol])
    key_metrics_expense_ratio_url = (f"https://data.businessquant.com/funds/overview?ticker={symbol}&api_key={BUSINESS_QUANT_API_KEY}")
    print("KEY METRICS URLLL", key_metrics_expense_ratio_url)
    key_metrics_expense_ratio_response = requests.get(key_metrics_expense_ratio_url, timeout=10)
    print(key_metrics_expense_ratio_response)

    print("Business Quant EXPENSE RATIO URL:", key_metrics_expense_ratio_url)

    print("Status:", key_metrics_expense_ratio_response.status_code)
    print("Response:", key_metrics_expense_ratio_response.text)

    if not key_metrics_expense_ratio_response.ok:
        return jsonify({
            "error": "Profile data request failed"
        }), key_metrics_expense_ratio_response.status_code 


    key_metrics_expense_ratio_data = key_metrics_expense_ratio_response.json()
    print("KEY METRICS EXPENSE RATIO DATA", key_metrics_expense_ratio_data)

    # mutual_fund_profile_cache[symbol] = profile_data
    return jsonify(key_metrics_expense_ratio_data)