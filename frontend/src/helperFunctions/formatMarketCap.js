export const formatMarketCap = (cap, currency) => {

    const TWD_TO_USD_RATE = 31.755

    if (cap === null || cap === undefined) {
        return "N/A"
    }

    let marketCap = cap

    if (currency === "TWD") {
        marketCap = cap / TWD_TO_USD_RATE
    }

    // The stock metrics API reports market capitalization in millions.
    if (marketCap >= 1_000_000) {
        return `${(marketCap / 1000000)?.toFixed(2)}T`
    } else if (marketCap >= 1_000) {
        return `${(marketCap / 1000)?.toFixed(2)}B`
    } else {
        return `${marketCap?.toFixed(2)}M`
    }
}