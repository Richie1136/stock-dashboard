import { useState, useEffect } from 'react'
import { formatIPOLayout } from '../../helperFunctions/formatIpoLayout'
import './CompanyCard.css'
import Loading from '../loading/Loading'
import { formatFundName } from '../../helperFunctions/formatFundName'
import { FaIndustry, FaBuilding, FaCalendarAlt, FaLink } from 'react-icons/fa'

const CompanyCard = ({ symbol, assetType, fundName, etfProfile, updateWatchList }) => {

    const [company, setCompany] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!symbol || assetType !== "Common Stock") return


        // AbortController is a built-in JavaScript API that lets you cancel an asynchronous operation
        const controller = new AbortController()

        const getCompanyCard = async () => {
            try {
                setIsLoading(true)
                setError("")
                const response = await fetch(`http://localhost:5001/api/company/${symbol}`,
                    { signal: controller.signal }

                )
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`)
                }
                const data = await response.json()
                setCompany(data)
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error(error)
                    setError("Unable to load company information")
                    setCompany(null)
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }
        getCompanyCard()
    }, [symbol, assetType])


    if (isLoading) {
        return (
            <div className="card company-card">
                <Loading />
            </div>
        )
    }

    if (!company && assetType === "Common Stock") {
        return <div className='card company-card'>
            <h3>{"Company Overview"}</h3>
            <p>{"Search for a stock to display company information."}</p>
        </div>
    }

    if (company?.error && assetType === "Common Stock") {
        return <div className='card company-card'>
            <h3>{"Company Overview"}</h3>
            <p>{"No company found. Try searching for a different stock."}</p>
        </div>

    }

    const { exchange, finnhubIndustry, ipo, logo, name, ticker, weburl } = company ?? {}

    const formatExchanges = {
        'NEW YORK STOCK EXCHANGE, INC.': 'NYSE',
        'NASDAQ NMS - GLOBAL MARKET': 'NASDAQ'
    }

    const displayFundName = formatFundName(fundName)

    return (
        <div className='card company-card'>
            {assetType !== "Common Stock" ? (
                <>
                    <h3>Fund Overview</h3>
                    <h2>{displayFundName}</h2>
                    <p>Ticker: {symbol}</p>
                    <p>Inception Date: {formatIPOLayout(etfProfile?.inception_date)}</p>
                    <p>Asset Type: {"ETF"}</p>
                    <p>Leveraged: {etfProfile?.leveraged}</p>
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
                                <p><strong>{ticker}</strong></p>
                                <span className='asset-badge'>Common Stock</span>
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
                                <span className='details-value'>{formatExchanges[exchange]}</span>
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