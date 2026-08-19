export const formatDisplayName = (stockName, type) => {
    const stockWords = stockName?.split(" ")
    const formattedDisplayName = type === 'Common Stock' ? stockWords?.map((item) => item[0].toUpperCase() + item.slice(1).toLowerCase()).join(" ") : stockName
    return formattedDisplayName
}