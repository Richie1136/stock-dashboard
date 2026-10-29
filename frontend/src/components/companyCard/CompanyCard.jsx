import { formatIPOLayout } from '../../helperFunctions/formatIpoLayout'
import './CompanyCard.css'
import Loading from '../loading/Loading'
import { formatFundName } from '../../helperFunctions/formatFundName'
import { FaIndustry, FaBuilding, FaCalendarAlt, FaLink, FaBolt } from 'react-icons/fa'
import { ASSET_TYPES, isStockAssetType } from '../../constants/assetTypes'

const CompanyCard = ({ symbol, isLoading, error, company, isItemInWatchlist, assetType, fundName, etfProfile, mutualFundProfile, updateWatchList }) => {

    const isStock = isStockAssetType(assetType)

    if (isLoading) {
        return (
            <div className="card company-card">
                <Loading />
            </div>
        )
    }

    if (error) {
        return (
            <div className="card company-card">
                <h3>{isStock ? "Company Overview" : "Fund Overview"}</h3>
                <p>{error}</p>
            </div>
        )
    }

    if (!company && isStock) {
        return <div className='card company-card'>
            <h3>Company Overview</h3>
            <p>Search for a stock to display company information.</p>
        </div>
    }

    if (company?.error && isStock) {
        return <div className='card company-card'>
            <h3>Company Overview</h3>
            <div className='company-header-info'>
                <h2>{fundName}</h2>
                <div className='ticker-row'>
                    <p><strong>{symbol}</strong></p>
                    <span className='asset-badge'>{assetType}</span>
                </div>
            </div>
            <div className='company-actions'>
                <button onClick={updateWatchList}>{isItemInWatchlist ? "Remove From Watchlist" : "Add To Watchlist"}</button>
            </div>
        </div>
    }

    const { exchange, finnhubIndustry, ipo, logo, name, weburl } = company ?? {}

    const formatExchanges = {
        // Finnhub returns formal exchange names; the card uses familiar abbreviations.
        'NEW YORK STOCK EXCHANGE, INC.': 'NYSE',
        'NASDAQ NMS - GLOBAL MARKET': 'NASDAQ',
        'NYSEArca': "NYSE Arca",
        'NasdaqGM': 'NASDAQ'
    }

    const displayFundName = formatFundName(fundName)

    const inceptionDate = etfProfile?.inception_date.split(" ")[0]

    return (
        <div className='card company-card'>
            {assetType === ASSET_TYPES.ETP || assetType === ASSET_TYPES.MUTUAL_FUND ? (
                <>
                    <h3>Fund Overview</h3>
                    <div className='company-header-info'>
                        <h2>{displayFundName}</h2>
                        <div className='ticker-row'>
                            <p><strong>{symbol}</strong></p>
                            <span className='asset-badge'>{assetType === ASSET_TYPES.ETP ? "ETF" : "Mutual Fund"}</span>
                        </div>
                        {assetType === ASSET_TYPES.ETP && (
                            <div className='company-details'>
                                <FaBuilding />
                                <span className='details-label'>Exchange: </span>
                                <span className='details-value'>{formatExchanges[etfProfile?.exchange] || etfProfile?.exchange}</span>
                            </div>
                        )}
                        <div className='company-details'>
                            <FaCalendarAlt />
                            <span className='details-label'>Inception Date: </span>
                            <span className='details-value'>{assetType === ASSET_TYPES.ETP ? formatIPOLayout(inceptionDate) : formatIPOLayout(mutualFundProfile?.firstpricedate)}</span>
                        </div>
                        {assetType === ASSET_TYPES.ETP && (
                            <div className='company-details'>
                                <FaBolt />
                                <span className='details-label'>Leveraged: </span>
                                <span className='details-value'>{etfProfile?.leveraged ?? "N/A"}</span>
                            </div>
                        )}
                    </div>
                    <div className='company-actions'>
                        <button onClick={updateWatchList}>{isItemInWatchlist ? "Remove From Watchlist" : "Add To Watchlist"}</button>
                    </div>
                </>
            ) : (
                <>
                    <h3>Company Overview</h3>
                    <div className='company-header'>
                        {logo && <img className='company-logo' src={logo} alt={name} />}
                        <div className='company-header-info'>
                            <h2>{name}</h2>
                            <div className='ticker-row'>
                                <p><strong>{symbol}</strong></p>
                                <span className='asset-badge'>{assetType}</span>
                            </div>
                            <div className='company-details'>
                                <FaIndustry />
                                <span className='details-label'>
                                    Industry:
                                </span>
                                <span className='details-value'>{finnhubIndustry}</span>
                            </div>
                            <div className='company-details'>
                                <FaBuilding />
                                <span className='details-label'>Exchange: </span>
                                <span className='details-value'>{formatExchanges[exchange] || exchange}</span>
                            </div>
                            <div className='company-details'>
                                <FaCalendarAlt />
                                <span className='details-label'>IPO: </span>
                                <span className='details-value'>{formatIPOLayout(ipo)}</span>
                            </div>
                        </div>
                    </div>
                    <div className='company-actions'>
                        <div className='company-details'>
                            <FaLink />
                            {weburl && <a href={weburl} target='_blank' rel='noopener noreferrer'>Website</a>}
                        </div>
                        <button onClick={updateWatchList}>{isItemInWatchlist ? "Remove From Watchlist" : "Add To Watchlist"}</button>
                    </div>
                </>
            )}
        </div>
    )
}

export default CompanyCard
