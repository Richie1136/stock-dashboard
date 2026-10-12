import os
import requests
from dotenv import load_dotenv
from functools import lru_cache
import time
from openfigi import get_tickers_in_batches

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
        return {"data": []}

    filing = filings[0]
    holdings = filing.get("invstOrSecs", [])

    reporting_date = filing.get("genInfo", {}).get("repPdDate")

    sorted_holdings = sorted(
        holdings,
        key=lambda holding: float(holding.get("valUSD") or 0),
        reverse=True
    )

    isins = []

    for holding in sorted_holdings:
        identifiers = holding.get("identifiers") or {}
        isin = (identifiers.get("isin") or {}).get("value")

        if isin:
            isins.append(isin)

    isins = list(dict.fromkeys(isins))

    start_time = time.perf_counter()

    ticker_map = get_tickers_in_batches(isins[:20])

    elapsed_time = time.perf_counter() - start_time

    print(f"OpenFIGI lookup took {elapsed_time:.2f} seconds")

    unresolved_isins = [
    isin
    for isin, ticker in ticker_map.items()
    if not ticker
]
    for holding in sorted_holdings:
        identifiers = holding.get("identifiers") or {}
        isin = (identifiers.get("isin") or {}).get("value")

        if isin in unresolved_isins:
            print("Unresolved Holding:", {
                "isin": isin,
                "name": holding.get("title") or holding.get("name"),
                "weight_pct": holding.get("pctVal")
            })

    print("ISINs Requested:", len(isins[:100]))

    print(
        "Tickers Resolved:",
        sum(1 for ticker in ticker_map.values() if ticker)
    )

    print(
        "Unresolved Tickers:",
        sum(1 for ticker in ticker_map.values() if not ticker)
    )

    for holding in sorted_holdings[:10]:
        print(
            holding.get("title") or holding.get("name"),
            holding.get("identifiers", {})
        )

    formatted_holdings = []

    for holding in sorted_holdings:
        identifiers = holding.get("identifiers") or {}
        isin = (identifiers.get("isin") or 
                {}).get("value")
        
        ticker = ticker_map.get(isin) if isin else None
        formatted_holdings.append({
            "issuer_ticker": ticker,
            "issuer_name": holding.get("title") or holding.get("name"),
            "weight_pct": float(holding.get("pctVal") or 0)
        })

    return {
        "data": formatted_holdings,
        "reporting_date": reporting_date,
        "total_holdings": len(sorted_holdings)
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