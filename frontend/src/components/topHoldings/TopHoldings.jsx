import { ASSET_TYPES } from '../../constants/assetTypes'
import './TopHoldings.css'

const TopHoldings = ({ holdings, assetType }) => {

    const holdingData = assetType === ASSET_TYPES.MUTUAL_FUND ? holdings?.data : holdings?.holdings

    const topTenHoldings = holdingData?.slice(0, 10) ?? []

    const topTenPercentage = topTenHoldings.reduce((total, item) => {
        const weight = assetType === ASSET_TYPES.MUTUAL_FUND ? item.weight_pct : item.weight
        const isEtf = assetType === ASSET_TYPES.ETP ? Number(weight) * 100 : weight
        return total + Number(isEtf)
    }, 0)

    return (
        <div className='card top-holdings-card'>
            <h2>Top Holdings</h2>
            <span className='total-portfolio-percentage'>{topTenPercentage.toFixed(2)}% of Total Portfolio</span>

            <div className='top-holdings-list'>
                {topTenHoldings.map((item, index) => {
                    const ticker = assetType === ASSET_TYPES.MUTUAL_FUND ? item.issuer_ticker : item.symbol
                    const name = assetType === ASSET_TYPES.MUTUAL_FUND ? item.issuer_name : item.description
                    const weight = assetType === ASSET_TYPES.MUTUAL_FUND ? item.weight_pct : item.weight
                    const isEtf = assetType === ASSET_TYPES.ETP ? Number(weight) * 100 : weight
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
                                { }
                                {isEtf?.toFixed(2)}%
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default TopHoldings