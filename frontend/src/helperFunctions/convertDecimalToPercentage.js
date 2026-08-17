export const convertDecimalToPercentage = (keyMetric) => {
    // Fund ratios are decimal fractions and are displayed as percentages.
    if (keyMetric !== undefined && keyMetric !== null) {
        return Number(keyMetric) * 100
    }
    return "N/A"
}