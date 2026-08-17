export const formatMetrics = (metric) => {
    if (metric === null || metric === undefined || metric === "") {
        return "N/A"
    }
    const convertedMetric = Number(metric);
    if (Number.isFinite(convertedMetric)) {
        return metric.toFixed(2)
    }
    return "N/A"
}