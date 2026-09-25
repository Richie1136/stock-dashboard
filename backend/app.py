# app.py

from flask import Flask
from companyProfile import company_profile_bp, fund_etf_profile_bp, fund_mutual_fund_profile_bp
from searchCompanies import search_companies_bp
from keyMetrics import key_metrics_bp, mutual_fund_expense_ratio_bp, fund_holdings_bp, fund_calculate_dividend_yield_bp
from priceChart import price_chart_bp
from companyNews import company_news_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Take all of the routes in this file and make them part of my application
app.register_blueprint(company_profile_bp)
app.register_blueprint(search_companies_bp)
app.register_blueprint(key_metrics_bp)
app.register_blueprint(price_chart_bp)
app.register_blueprint(fund_mutual_fund_profile_bp)
app.register_blueprint(company_news_bp)
app.register_blueprint(fund_etf_profile_bp)
app.register_blueprint(fund_holdings_bp)
app.register_blueprint(mutual_fund_expense_ratio_bp)
app.register_blueprint(fund_calculate_dividend_yield_bp)

@app.route("/")
def home():
    return {"message": "Backend Running"}

if __name__ == "__main__":
    app.run(debug=True, port=5001)