import { ASSET_TYPES } from '../constants/assetTypes'

export const formatDisplayName = (stockName, type) => {
    // Stock names arrive uppercase; preserve fund casing because it can contain brand styling.
    const stockWords = stockName?.split(" ")
    const formattedDisplayName = type === ASSET_TYPES.COMMON_STOCK ? stockWords?.map((item) => item[0].toUpperCase() + item.slice(1).toLowerCase()).join(" ") : stockName
    return formattedDisplayName
}