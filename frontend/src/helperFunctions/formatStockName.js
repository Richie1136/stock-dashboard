export const formatStockName = (stockName) => {
    const stockWords = stockName?.split(" ")
    const formattedStockName = stockWords?.map((item) => item[0].toUpperCase() + item.slice(1).toLowerCase()).join(" ")
    return formattedStockName
}