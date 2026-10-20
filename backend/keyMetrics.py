from flask import jsonify, Blueprint
from dotenv import load_dotenv
import os
import requests
from sec_fund_holdings import get_fund_holdings_by_symbol
from yahooquery import Ticker

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
        return jsonify({"error": "A fund symbol is required"}), 400
        
    if symbol in fund_holdings_cache:
        print("Fund HOLDINGS CACHE HIT:", symbol)
        return jsonify(fund_holdings_cache[symbol])
    try:
         # Get total holdings count from SEC
         fund_holdings_data = get_fund_holdings_by_symbol(symbol)

         # Get top 10 holdings from Yahoo Finance
         fund = Ticker(symbol)
         yahoo_data = fund.fund_holding_info.get(symbol, {})

         yahoo_holdings = yahoo_data.get("holdings", [])

         formatted_holdings = []

         for holding in yahoo_holdings:
              formatted_holdings.append({
                   "issuer_ticker": holding.get("symbol"),
                   "issuer_name": holding.get("holdingName"),
                   "weight_pct": holding.get("holdingPercent", 0) * 100
              })

         fund_holdings_data = {
              "data": formatted_holdings,
              "reporting_date": fund_holdings_data.get("reporting_date"),
              "total_holdings": fund_holdings_data.get("total_holdings", 0)
         }

    except requests.exceptions.ReadTimeout:
        return jsonify ({
            "error": "Fund Holdings provider timed out"
        }), 504
    
    except requests.exceptions.ConnectionError:
        return jsonify ({
            "error": "Fund Holdings provider unavailable"
        }), 503
    
    if not fund_holdings_data.get("data"):
        return jsonify({
            "error": f"No fund holdings found for {symbol}",

        }), 404
    
    fund_holdings_cache[symbol] = fund_holdings_data

    return jsonify(fund_holdings_data)


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
        return jsonify(mutual_fund_expense_ratio_cache[symbol])

    fund = Ticker(symbol)

    yahoo_profile = fund.fund_profile.get(symbol, {})
    yahoo_performance = fund.fund_performance.get(symbol, {})
    yahoo_summary = fund.summary_detail.get(symbol, {})
    yahoo_key_stats = fund.key_stats.get(symbol, {})

    # Expense Ratio

    expense_ratio = yahoo_profile.get("feesExpensesInvestment", {}).get("netExpRatio")

    # Net Assets

    net_assets = yahoo_summary.get("totalAssets")

    # Dividend Yield

    dividend_yield = yahoo_summary.get("yield")

    # Morningstar Ratings

    morningstar_overall_rating = yahoo_key_stats.get("morningStarOverallRating")

    morningstar_risk_rating = yahoo_key_stats.get("morningStarRiskRating")

    # Portfolio Turnover

    portfolio_turnover = yahoo_key_stats.get("annualHoldingsTurnover")

    # Beta (5Y)

    risk_statistics = yahoo_performance.get("riskOverviewStatistics", {}).get("riskStatistics", [])

    beta_5y = next((risk.get("beta") for risk in risk_statistics if risk.get("year") == "5y"), None)

    key_metrics_expense_ratio_data = {
        "summary": {
            "assets": {
                "net_assets_usd": net_assets
            },
            "fees": {
                "net_expense_ratio_pct": expense_ratio * 100 if expense_ratio is not None else None,
                "portfolio_turnover_pct": portfolio_turnover * 100 if portfolio_turnover is not None else None
            },
            "risk_ratio": {
                "beta_5y": beta_5y
            },
            "dividend_yield_pct": dividend_yield * 100 if dividend_yield is not None else None,
            "morningstar_overall_rating": morningstar_overall_rating,
            "morningstar_risk_rating": morningstar_risk_rating
        }
    }

    mutual_fund_expense_ratio_cache[symbol] = key_metrics_expense_ratio_data

    return jsonify(key_metrics_expense_ratio_data)