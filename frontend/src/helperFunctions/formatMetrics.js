export const formatMetrics = (metric) => {
    // Check missing values before Number() would turn null or an empty string into zero.
    if (metric === null || metric === undefined || metric === "") {
        return "N/A"
    }
    const convertedMetric = Number(metric);
    if (Number.isFinite(convertedMetric)) {
        return convertedMetric.toFixed(2)
    }
    return "N/A"
}