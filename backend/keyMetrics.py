from flask import jsonify, Blueprint
from dotenv import load_dotenv
import os
import requests

load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY', "").strip()

key_metrics_bp = Blueprint("key_metrics", __name__)

key_metrics_cache = {}

@key_metrics_bp.route("/api/metrics/<symbol>", methods=['GET'])
def key_metrics(symbol):
    symbol = symbol.strip().upper()

    if not symbol:
        return jsonify({"error": "A stock symbol is required"}), 400
    
    headers = {
        "X-Finnhub-Token": API_KEY
    }

    key_metrics_symbol_url = (f"https://finnhub.io/api/v1/stock/metric?symbol={symbol}&metric=all")
    if symbol in key_metrics_cache:
        print("FINNHUB KEY METRICS CACHE HIT:", symbol)
        return jsonify(key_metrics_cache[symbol])
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
    key_metrics_cache[symbol] = metrics

    return jsonify(metrics)




fund_holdings_bp = Blueprint("fund_holdings", __name__)

BUSINESS_QUANT_API_KEY= os.getenv('BUSINESS_QUANT_API_KEY', "").strip()

fund_holdings_cache = {}

@fund_holdings_bp.route("/api/fund/holdings/<symbol>", methods=['GET'])
def fund_holdings(symbol):
    symbol = symbol.strip().upper()

    if not symbol:
        return jsonify({"error": "A stock symbol is required"}), 400
        
    if symbol in fund_holdings_cache:
        print("BUSINESS QUANT HOLDINGS CACHE HIT:", symbol)
        return jsonify(fund_holdings_cache[symbol])
    key_metrics_holdings_url = (f"https://data.businessquant.com/funds/holdings?ticker={symbol}&api_key={BUSINESS_QUANT_API_KEY}")
    key_metrics_holdings_response = requests.get(key_metrics_holdings_url, timeout=10)

    if not key_metrics_holdings_response.ok:
        return jsonify({
            "error": "Profile data request failed",
            "details": key_metrics_holdings_response.text

        }), key_metrics_holdings_response.status_code 
    
    key_metrics_holdings_data = key_metrics_holdings_response.json()

    fund_holdings_cache[symbol] = key_metrics_holdings_data

    return jsonify(key_metrics_holdings_data)

fund_calculate_dividend_yield_bp = Blueprint("calculate_dividend_yield", __name__)

BUSINESS_QUANT_API_KEY= os.getenv('BUSINESS_QUANT_API_KEY', "").strip()

fund_calculate_dividend_yield_cache = {}

@fund_calculate_dividend_yield_bp.route("/api/dividends/<symbol>", methods=['GET'])
def fund_calculate_dividend_yield(symbol):
    symbol = symbol.strip().upper()

    if not symbol:
        return jsonify({"error": "A fund symbol is required"}), 400
        
    if symbol in fund_calculate_dividend_yield_cache:
        print("BUSINESS QUANT HOLDINGS CACHE HIT:", symbol)
        return jsonify(fund_calculate_dividend_yield_cache[symbol])

    fund_calculate_dividend_yield_url = (f"https://data.businessquant.com/dividends?ticker={symbol}&api_key={BUSINESS_QUANT_API_KEY}")
    fund_calculate_dividend_yield_response = requests.get(fund_calculate_dividend_yield_url, timeout=10)

    if not fund_calculate_dividend_yield_response.ok:
        return jsonify({
            "error": "Profile data request failed",
            "details": fund_calculate_dividend_yield_response.text

        }), fund_calculate_dividend_yield_response.status_code 
    
    fund_calculate_dividend_yield_data = fund_calculate_dividend_yield_response.json()

    ttm_dividend = fund_calculate_dividend_yield_data['metadata'].get("ttmdividend")

    fund_calculate_dividend_yield_cache[symbol] = ttm_dividend

    return jsonify(ttm_dividend)



mutual_fund_expense_ratio_bp = Blueprint("mutual_fund_expense_ratio", __name__)

mutual_fund_expense_ratio_cache = {}


@mutual_fund_expense_ratio_bp.route("/api/mutual-fund/expense-ratio/<symbol>", methods=['GET'])
def mutual_fund_expense_ratio(symbol):
    symbol = symbol.strip().upper()

    if not symbol:
        return jsonify({"error": "A stock symbol is required"}), 400
    
    if symbol in mutual_fund_expense_ratio_cache:
        print("BUSINESS QUANT EXPENSE RATIO CACHE HIT:", symbol)
        return jsonify(mutual_fund_expense_ratio_cache[symbol])

    key_metrics_expense_ratio_url = (f"https://data.businessquant.com/funds/overview?ticker={symbol}&api_key={BUSINESS_QUANT_API_KEY}")
    key_metrics_expense_ratio_response = requests.get(key_metrics_expense_ratio_url, timeout=10)
  
    if not key_metrics_expense_ratio_response.ok:
        return jsonify({
            "error": "Profile data request failed"
        }), key_metrics_expense_ratio_response.status_code 

    key_metrics_expense_ratio_data = key_metrics_expense_ratio_response.json()

    mutual_fund_expense_ratio_cache[symbol] = key_metrics_expense_ratio_data

    return jsonify(key_metrics_expense_ratio_data)