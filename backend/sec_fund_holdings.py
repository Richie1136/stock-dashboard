import os
import requests
from dotenv import load_dotenv
from functools import lru_cache

load_dotenv()

SEC_API_KEY = os.getenv("SEC_API_KEY")

if not SEC_API_KEY:
    raise ValueError("SEC_API_KEY is missing from your environment variables")

url = "https://api.sec-api.io/form-nport"

headers = {
    "Authorization": SEC_API_KEY,
    "Content-Type": "application/json"
}

@lru_cache(maxsize=1)
def get_sec_ticker_data():
    sec_url = "https://www.sec.gov/files/company_tickers_mf.json"

    response = requests.get(
        sec_url,
        headers={
            "User-Agent": "StockDashboard richardthagenah@gmail.com"
        },
        timeout=15
    )

    response.raise_for_status()

    return response.json()

def get_fund_series_id(symbol):
    data = get_sec_ticker_data()

    for row in data.get("data", []):
        cik, series_id, class_id, ticker = row

        if ticker.upper() == symbol.upper():
            return series_id

    return None

def get_sec_fund_holdings(series_id):
    payload = {
        "query": f"filerInfo.seriesClassInfo.seriesId:{series_id}",
        "from": "0",
        "size": "1",
        "sort": [{"filedAt": {"order": "desc"}}]
    }

    response = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=30
    )

    response.raise_for_status()

    data = response.json()

    filings = data.get("filings", [])

    if not filings:
        return {"data": [], "reporting_date": None, "total_holdings": 0}

    filing = filings[0]
    holdings = filing.get("invstOrSecs", [])

    reporting_date = filing.get("genInfo", {}).get("repPdDate")

    return {
        "data": [],
        "reporting_date": reporting_date,
        "total_holdings": len(holdings)
    }

def get_fund_holdings_by_symbol(symbol):
    series_id = get_fund_series_id(symbol)

    if not series_id:
        return {"data": []}

    return get_sec_fund_holdings(series_id)

if __name__ == "__main__":
    result = get_fund_holdings_by_symbol("FZROX")

    print("Total Holdings:", len(result["data"]))

    for holding in result["data"][:3]:
        print(holding)
        
    print("Reporting Date:", result.get("reporting_date"))
    print("Total Reported Holdings:", result.get("total_holdings"))