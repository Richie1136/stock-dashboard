import { useState, useEffect } from 'react'
import { formatIPOLayout } from '../../helperFunctions/formatIpoLayout'
import './CompanyCard.css'

const CompanyCard = ({ symbol }) => {

    const [company, setCompany] = useState(null)

    useEffect(() => {
        if (!symbol) return
        try {
            const getCompanyCard = async () => {
                const response = await fetch(`http://localhost:5001/api/company/${symbol}`)
                const data = await response.json()
                setCompany(data)
            }
            getCompanyCard()
        } catch (error) {
            console.error("Error fetching company data:", error)
        }
    }, [symbol])

    if (!company) {
        return <div className='card company-card'>
            <h3>{"Company Overview"}</h3>
            <p>{"Search for a stock to display company information."}</p>
        </div>
    }

    if (company.error) {
        return <div className='card company-card'>
            <h3>{"Company Overview"}</h3>
            <p>{"No company found. Try searching for a different stock."}</p>
        </div>

    }

    const { exchange, finnhubIndustry, ipo, logo, marketCapitalization, name, ticker, weburl } = company

    const formatExchanges = {
        'NEW YORK STOCK EXCHANGE, INC.': 'NYSE',
        'NASDAQ NMS - GLOBAL MARKET': 'NASDAQ'
    }


    const marketCap = (cap) => {
        if (cap >= 1_000_000) {
            return `${(cap / 1000000).toFixed(2)}T`
        } else if (cap >= 1_000) {
            return `${(cap / 1000).toFixed(2)}B`
        } else {
            return `${cap.toFixed(2)}M`
        }
    }


    return (
        <div className='card company-card'>
            <h3>Company Overview</h3>
            {logo && <img className='company-logo' src={logo} alt={name} />}
            <h2>{name}</h2>
            <p><strong>{ticker}</strong></p>
            <p>Industry: {finnhubIndustry}</p>
            <p>Exchange: {formatExchanges[exchange]}</p>
            <p>IPO: {formatIPOLayout(ipo)}</p>
            <p>Market Capitalization: {marketCap(marketCapitalization)}</p>
            <a href={weburl} target='_blank' rel='noopener noreferrer'>Website</a>
        </div>
    )
}

export default CompanyCard