export const formatMarketCap = (cap) => {
    // The stock metrics API reports market capitalization in millions.
    if (cap !== null && cap !== undefined) {
        if (cap >= 1_000_000) {
            return `${(cap / 1000000)?.toFixed(2)}T`
        } else if (cap >= 1_000) {
            return `${(cap / 1000)?.toFixed(2)}B`
        } else {
            return `${cap?.toFixed(2)}M`
        }
    }
    return "N/A"
}