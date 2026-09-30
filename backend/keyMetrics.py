from flask import jsonify, Blueprint
from dotenv import load_dotenv
import os
import requests

load_dotenv()

API_KEY= os.getenv('FINNHUB_API_KEY', "").strip()
BUSINESS_QUANT_API_KEY= os.getenv('BUSINESS_QUANT_API_KEY', "").strip()


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
    try:
        key_metrics_symbol_response = requests.get(key_metrics_symbol_url, headers=headers, timeout=10)
    except requests.exceptions.ReadTimeout:
        return jsonify ({
            "error": "Metrics provider timed out"
        }), 504
    
    except requests.exceptions.ConnectionError:
        return jsonify ({
            "error": "Metrics provider unavailable"
        }), 503


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

    try:
        key_metrics_holdings_response = requests.get(key_metrics_holdings_url, timeout=10)
    except requests.exceptions.ReadTimeout:
        return jsonify ({
            "error": "Fund Holdings provider timed out"
        }), 504
    
    except requests.exceptions.ConnectionError:
        return jsonify ({
            "error": "Fund Holdings provider unavailable"
        }), 503
    
    if not key_metrics_holdings_response.ok:
        return jsonify({
            "error": "Fund holdings data request failed",
            "details": key_metrics_holdings_response.text

        }), key_metrics_holdings_response.status_code 
    

    
    key_metrics_holdings_data = key_metrics_holdings_response.json()

    fund_holdings_cache[symbol] = key_metrics_holdings_data

    return jsonify(key_metrics_holdings_data)

fund_calculate_dividend_yield_bp = Blueprint("calculate_dividend_yield", __name__)

fund_calculate_dividend_yield_cache = {}

@fund_calculate_dividend_yield_bp.route("/api/dividends/<symbol>", methods=['GET'])
def fund_calculate_dividend_yield(symbol):
    symbol = symbol.strip().upper()

    if not symbol:
        return jsonify({"error": "A fund symbol is required"}), 400
        
    if symbol in fund_calculate_dividend_yield_cache:
        print("BUSINESS QUANT DIVIDEND CACHE HIT:", symbol)
        return jsonify(fund_calculate_dividend_yield_cache[symbol])

    fund_calculate_dividend_yield_url = (f"https://data.businessquant.com/dividends?ticker={symbol}&api_key={BUSINESS_QUANT_API_KEY}")

    try:
        fund_calculate_dividend_yield_response = requests.get(fund_calculate_dividend_yield_url, timeout=10)
    except requests.exceptions.ReadTimeout:
            
            return jsonify ({
                "error": "Fund dividend yield provider timed out"
            }), 504
    
    except requests.exceptions.ConnectionError:
            return jsonify ({
                "error": "Fund dividend yield provider unavailable"
            }), 503

    if not fund_calculate_dividend_yield_response.ok:
        return jsonify({
            "error": "Fund dividend data request failed",
            "details": fund_calculate_dividend_yield_response.text

        }), fund_calculate_dividend_yield_response.status_code 
    
    fund_calculate_dividend_yield_data = fund_calculate_dividend_yield_response.json()

    dividend_yield = fund_calculate_dividend_yield_data['metadata'].get("divyield")

    fund_calculate_dividend_yield_cache[symbol] = dividend_yield

    return jsonify(dividend_yield)



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

    try:
        key_metrics_expense_ratio_response = requests.get(key_metrics_expense_ratio_url, timeout=10)
    except requests.exceptions.ReadTimeout:
            
            return jsonify ({
                "error": "Key Metrics Expense Ratio provider timed out"
            }), 504
    
    except requests.exceptions.ConnectionError:
            return jsonify ({
                "error": "Key Metrics Expense Ratio provider unavailable"
            }), 503
  
    if not key_metrics_expense_ratio_response.ok:
        return jsonify({
            "error": "Key Metrics Expense Ratio data request failed"
        }), key_metrics_expense_ratio_response.status_code 

    key_metrics_expense_ratio_data = key_metrics_expense_ratio_response.json()

    mutual_fund_expense_ratio_cache[symbol] = key_metrics_expense_ratio_data

    return jsonify(key_metrics_expense_ratio_data)