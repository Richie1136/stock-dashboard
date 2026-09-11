export const ASSET_TYPES = Object.freeze({
    COMMON_STOCK: "Common Stock",
    ADR: "ADR",
    NY_REGISTERED_SHARES: "NY Reg Shrs",
    ETP: "ETP",
    MUTUAL_FUND: "Mutual Fund"
})

const STOCK_ASSET_TYPES = new Set([
    ASSET_TYPES.COMMON_STOCK,
    ASSET_TYPES.ADR,
    ASSET_TYPES.NY_REGISTERED_SHARES,
])

const SUPPORTED_ASSET_TYPES = new Set([
    ...STOCK_ASSET_TYPES,
    ASSET_TYPES.ETP,
    ASSET_TYPES.MUTUAL_FUND
])

const FUNd_ASSET_TYPES = new Set([
    ASSET_TYPES.ETP,
    ASSET_TYPES.MUTUAL_FUND
])

export const isStockAssetType = (assetType) => STOCK_ASSET_TYPES.has(assetType)

export const isFundAssetType = (assetType) => FUNd_ASSET_TYPES.has(assetType)

export const isSupportedAssetType = (assetType) => SUPPORTED_ASSET_TYPES.has(assetType)
