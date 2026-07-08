# app.py

from flask import Flask
from companyProfile import company_profile_bp
from searchCompanies import search_companies_bp
from keyMetrics import key_metrics_bp
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

# Take all of the routes in this file and make them part of my application
app.register_blueprint(company_profile_bp)
app.register_blueprint(search_companies_bp)
app.register_blueprint(key_metrics_bp)

@app.route("/")
def home():
    return {"message": "Backend Running"}

if __name__ == "__main__":
    app.run(debug=True, port=5001)