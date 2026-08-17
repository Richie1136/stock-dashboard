export const formatLargePriceValue = (value) => {
    if (value == null) return ""

    if (value > 99_000) {
        const largeValue = value / 1_000
        return `$${largeValue.toFixed(1)}K`
    }
    return `$${value.toFixed(2)}`
}