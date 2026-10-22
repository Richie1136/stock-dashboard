import requests
from functools import lru_cache
import xml.etree.ElementTree as ET

# Reuse the full ticker-to-series directory across lookups in this process.
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

def get_fund_sec_identifiers(symbol):
    data = get_sec_ticker_data()

    for row in data.get("data", []):
        cik, series_id, class_id, ticker = row

        if ticker.upper() == symbol.upper():
            return {
                "cik": str(cik).zfill(10),
                "series_id": series_id
            }

    return None

def get_fund_nport_filings(cik, series_id=None):
    """Return recent N-PORT filings, filtered by fund series when supplied."""
    if series_id:
        # EDGAR accepts a series ID in CIK and filters before returning filings.
        response = requests.get(
            "https://www.sec.gov/cgi-bin/browse-edgar",
            params={
                "action": "getcompany",
                "CIK": series_id,
                "type": "NPORT-P",
                "owner": "exclude",
                "count": 40,
                "output": "atom"
            },
            headers={"User-Agent": "StockDashboard richardthagenah@gmail.com"},
            timeout=15
        )
        response.raise_for_status()
        root = ET.fromstring(response.content)
        namespaces = {"atom": "http://www.w3.org/2005/Atom"}
        if root.tag != "{http://www.w3.org/2005/Atom}feed":
            raise ValueError("SEC returned an unexpected filing feed")

        filings = []
        for entry in root.findall("atom:entry/atom:content", namespaces):
            form = entry.findtext("atom:filing-type", namespaces=namespaces)
            if form not in ("NPORT-P", "NPORT-P/A"):
                continue
            accession = entry.findtext("atom:accession-number", namespaces=namespaces)
            filing_date = entry.findtext("atom:filing-date", namespaces=namespaces)
            if not accession or not filing_date:
                raise ValueError("SEC filing feed is missing filing metadata")
            filings.append({
                "accession_number": accession,
                "document": "primary_doc.xml",
                "filing_date": filing_date
            })
        return filings

    # Keep registrant-wide listing available for callers that omit a series.
    url = f"https://data.sec.gov/submissions/CIK{cik}.json"

    response = requests.get(
        url,
        headers={
            "User-Agent": "StockDashboard richardthagenah@gmail.com"
        },
        timeout=15
    )

    response.raise_for_status()

    data = response.json()
    recent = data.get("filings", {}).get("recent", {})

    nport_filings = []

    for form, accession, document, filing_date in zip(
        recent.get("form", []),
        recent.get("accessionNumber", []),
        recent.get("primaryDocument", []),
        recent.get("filingDate", [])
    ):
        if form in ("NPORT-P", "NPORT-P/A"):
            nport_filings.append({
                "accession_number": accession,
                "document": document,
                "filing_date": filing_date
            })

    return nport_filings[:150]

# Cache results in this process; restarting the backend clears this cache.
@lru_cache(maxsize=128)
def find_fund_nport_filing(symbol):
    identifiers = get_fund_sec_identifiers(symbol)

    if not identifiers:
        return None

    cik = identifiers["cik"]
    series_id = identifiers["series_id"]

    filings = get_fund_nport_filings(cik, series_id=series_id)

    for filing in filings:
        accession = filing["accession_number"].replace("-", "")

        url = (
            f"https://www.sec.gov/Archives/edgar/data/"
            f"{int(cik)}/{accession}/primary_doc.xml"
        )

        response = requests.get(
            url,
            headers={
                "User-Agent": "StockDashboard richardthagenah@gmail.com"
            },
            timeout=15
        )

        response.raise_for_status()

        root = ET.fromstring(response.content)

        namespaces = {
            "nport": "http://www.sec.gov/edgar/nport"
        }

        filing_series_id = root.findtext(
            ".//nport:genInfo/nport:seriesId",
            namespaces=namespaces
        )

        # Verify the document itself before using its holdings count.
        if filing_series_id == series_id:
            holdings = root.findall(".//nport:invstOrSec", namespaces)

            reporting_date = root.findtext(
                ".//nport:genInfo/nport:repPdDate",
                namespaces=namespaces
            )

            return {
                "series_id": filing_series_id,
                "accession_number": filing["accession_number"],
                "filing_date": filing["filing_date"],
                "reporting_date": reporting_date,
                "total_holdings": len(holdings)
            }

    return None

def get_fund_holdings_by_symbol(symbol):
    filing = find_fund_nport_filing(symbol)


    if not filing:
        return {"data": [], "reporting_date": None, "total_holdings": None}

    return {
        "data": [],
        "reporting_date": filing['reporting_date'],
        "total_holdings": filing['total_holdings']
    }