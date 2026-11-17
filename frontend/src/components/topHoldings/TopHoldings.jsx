import { ASSET_TYPES } from '../../constants/assetTypes'
import './TopHoldings.css'

const TopHoldings = ({ holdings, assetType, totalAmountOfHoldings, assetAllocation, symbol, fundName }) => {

    const holdingData = assetType === ASSET_TYPES.MUTUAL_FUND ? holdings?.data : holdings?.holdings ?? holdings?.data
    const topTenHoldings = holdingData?.slice(0, 10) ?? []

    // ETF weights are fractions; mutual-fund weights already use percentage units.
    const topTenPercentage = topTenHoldings.reduce((total, item) => {
        const weight = assetType === ASSET_TYPES.MUTUAL_FUND ? item.weight_pct : item.weight ?? item.weight_pct
        const percentage = item.weight != null && assetType === ASSET_TYPES.ETP ? Number(weight) * 100 : Number(weight)
        return total + percentage
    }, 0)

    const hasTopHoldings = topTenHoldings.length > 0

    return (
        <div className='card top-holdings-card'>
            <h2>{hasTopHoldings ? `Top Holdings (${totalAmountOfHoldings?.toLocaleString("en-US")})` : "Asset Allocation"}</h2>
            <span className='total-portfolio-percentage'>{hasTopHoldings ? `${topTenPercentage.toFixed(2)}% of Total Portfolio` : `${symbol} · ${fundName}`}</span>

            <div className='top-holdings-list'>
                {topTenHoldings.map((item, index) => {
                    const ticker = assetType === ASSET_TYPES.MUTUAL_FUND ? item.issuer_ticker : item.symbol ?? item.issuer_ticker
                    const name = item.issuer_name ?? item.description
                    const weight = assetType === ASSET_TYPES.MUTUAL_FUND ? item.weight_pct : item.weight ?? item.weight_pct
                    const percentage = item.weight != null && assetType === ASSET_TYPES.ETP ? Number(weight) * 100 : Number(weight)
                    const rank = index + 1
                    return (
                        <div className='top-holding-row' key={`${ticker}-${index}`}>
                            <span className='holding-rank'>{rank}.</span>
                            <div className='holding-info'>
                                <span className='holding-ticker'>
                                    {ticker}
                                </span>
                                <span className='holding-name'>
                                    {name}
                                </span>
                            </div>
                            <span className='holding-weight'>
                                {percentage?.toFixed(2)}%
                            </span>
                        </div>
                    )
                })}
            </div>

            {!hasTopHoldings && (
                <div className='allocation-list'>
                    {[
                        ["bonds", "Bonds"],
                        ["stocks", "Stocks"],
                        ["cash", "Cash"],
                        ["other", "Other"],
                        ["preferred", "Preferred"],
                        ["convertible", "Convertible"],
                    ].map(([key, label]) => {
                        const value = assetAllocation?.[key]

                        return (
                            <div className='allocation-row' key={key}>
                                <span>{label}</span>
                                <span>
                                    {Number.isFinite(value) ? `${value.toFixed(2)}%` : "N/A"}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default TopHoldings