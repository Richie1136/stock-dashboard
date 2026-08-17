export const formatNetAssets = (netAsset) => {
    // ETF net assets arrive as raw dollars, unlike stock market capitalization.
    if (netAsset !== null && netAsset !== undefined && netAsset !== "N/A") {
        if (netAsset > 1_000_000_000_000) {
            return `${(netAsset / 1_000_000_000_000)?.toFixed(2)}T`
        } else if (netAsset > 1_000_000_000) {
            return `${(netAsset / 1_000_000_000)?.toFixed(2)}B`
        } else {
            return `${(netAsset / 1_000_000)?.toFixed(2)}M`
        }
    }
    return "N/A"
}