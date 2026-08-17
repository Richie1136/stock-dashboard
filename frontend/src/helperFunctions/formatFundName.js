export const formatFundName = (fund) => {
    if (!fund) return ""
    // Expand abbreviations returned by the fund search API for display.
    return fund
        .replace(/\bIS\b/g, "Income Strategy")
        .replace(/\bTS MKT\b/g, "Total Stock Market")
        .replace(/\bDVD\b/g, "Dividend")
        .replace(/\bVG\b/g, "Vanguard")
        .replace(/\bETF-US\b/g, "ETF")
}