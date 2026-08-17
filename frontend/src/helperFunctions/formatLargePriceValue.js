export const formatLargePriceValue = (value) => {
    if (value == null || value === undefined) return ""

    if (value > 99_000) {
        const largeValue = value / 1_000
        return `$${largeValue.toFixed(1)}K`
    }
    return `$${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`
}