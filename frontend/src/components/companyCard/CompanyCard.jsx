import { useState, useEffect } from 'react'
import { formatIPOLayout } from '../../helperFunctions/formatIpoLayout'
import './CompanyCard.css'
import Loading from '../loading/Loading'
import { formatFundName } from '../../helperFunctions/formatFundName'
import { FaIndustry, FaBuilding, FaCalendarAlt, FaLink } from 'react-icons/fa'
import { apiBaseUrl } from '../../utils/apiConfig'
import { ASSET_TYPES, isStockAssetType } from '../../constants/assetTypes'

const CompanyCard = ({ symbol, isLoading, error, company, assetType, fundName, etfProfile, mutualFundProfile, updateWatchList }) => {

    const isStock = isStockAssetType(assetType)

    if (isLoading) {
        return (
            <div className="card company-card">
                <Loading />
            </div>
        )
    }

    if (!company && isStock) {
        return <div className='card company-card'>
            <h3>{"Company Overview"}</h3>
            <p>{"Search for a stock to display company information."}</p>
        </div>
    }

    if (company?.error && isStock) {
        return <div className='card company-card'>
            <h3>{"Company Overview"}</h3>
            <p>{"No company found. Try searching for a different stock."}</p>
        </div>

    }

    const { exchange, finnhubIndustry, ipo, logo, name, weburl } = company ?? {}

    const formatExchanges = {
        // Finnhub returns formal exchange names; the card uses familiar abbreviations.
        'NEW YORK STOCK EXCHANGE, INC.': 'NYSE',
        'NASDAQ NMS - GLOBAL MARKET': 'NASDAQ'
    }

    const displayFundName = formatFundName(fundName)

    return (
        <div className='card company-card'>
            {assetType === ASSET_TYPES.ETP || assetType === ASSET_TYPES.MUTUAL_FUND ? (
                <>
                    <h3>Fund Overview</h3>
                    <h2>{displayFundName}</h2>
                    <p>Ticker: {symbol}</p>
                    <p>Inception Date: {assetType === "ETP" ? formatIPOLayout(etfProfile?.inception_date) : formatIPOLayout(mutualFundProfile?.firstpricedate)}</p>
                    <p>Asset Type: {assetType === "ETP" ? "ETF" : "Mutual Fund"}</p>
                    {assetType === "ETP" && <p>Leveraged: {etfProfile?.leveraged}</p>}
                    <div className='company-actions'>
                        <button onClick={updateWatchList}>Add To Watchlist</button>
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
                        <button onClick={updateWatchList}>Add To Watchlist</button>
                    </div>
                </>
            )}
        </div>
    )
}

export default CompanyCard
