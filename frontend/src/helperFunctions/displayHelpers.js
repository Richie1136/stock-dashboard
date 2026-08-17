
export const getSymbol = (symbol, value) => {
    if (value !== null && value !== undefined && value >= 0.0) {
        return symbol
    }
    return ""
}