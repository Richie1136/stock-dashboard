from yahooquery import Ticker
from datetime import date, timedelta
from flask import Blueprint, jsonify
from priceChart import get_price_history

def get_latest_cached_price(symbol):
    price_history = get_price_history(symbol)

    # Check for empty data regardless of whether it came from SQLite or BusinessQuant.
    if not price_history:
        return None
    
    latest_record = max(
        price_history,
        key=lambda record: record['date']
    )

    print("Latest cached record:", latest_record)

    return float(latest_record['close'])

def calculate_distribution_yield(total_distributions, latest_price):
    if latest_price is None or latest_price <= 0:
        return None
    return (total_distributions / latest_price) * 100

def get_total_distributions(symbol):
    end_date = date.today()
    start_date = end_date - timedelta(days=365)

    fund = Ticker(symbol)

    dividends = fund.dividend_history(
        start=start_date.strftime("%Y-%m-%d"),
        end=(end_date + timedelta(days=1)).strftime("%Y-%m-%d"
        )
    )

    if dividends is None or not hasattr(dividends, 'columns'):
        return None
    
    if dividends.empty or "dividends" not in dividends.columns:
        return None
    
    return float(dividends['dividends'].sum())


distribution_yield_bp = Blueprint("distribution_yield",  __name__)

@distribution_yield_bp.route("/api/distribution-yield/<symbol>", methods=['GET'])

def distribution_yield(symbol):
        symbol = symbol.strip().upper()
        try:

            latest_price = get_latest_cached_price(symbol)
            total_distributions = get_total_distributions(symbol)

            if latest_price is None or total_distributions is None:
                return jsonify({
                    "error": "Unable to calculate distribution yield"
                }), 404
        
            yield_percentage = calculate_distribution_yield(
                total_distributions,
                latest_price
            )

            if yield_percentage is None:
                return jsonify({
                    "error": "Unable to calculate distribution yield"
                }), 404

            return jsonify({
                "symbol": symbol,
                "distribution_yield": round(yield_percentage, 2)
            })
        
        except Exception as error:
            print(f"DISTRIBUTION YIELD ERROR ({symbol}):", error)

            return jsonify({
                "error": "Unable to retrieve distribution yield"
            }), 502