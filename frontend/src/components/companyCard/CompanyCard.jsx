import { useState, useEffect } from 'react'
import { formatIPOLayout } from '../../helperFunctions/formatIpoLayout'
import './CompanyCard.css'

const CompanyCard = ({ symbol }) => {

    const [company, setCompany] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!symbol) return


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

    const { exchange, finnhubIndustry, ipo, logo, name, ticker, weburl } = company

    const formatExchanges = {
        'NEW YORK STOCK EXCHANGE, INC.': 'NYSE',
        'NASDAQ NMS - GLOBAL MARKET': 'NASDAQ'
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
            <a href={weburl} target='_blank' rel='noopener noreferrer'>Website</a>
        </div>
    )
}

export default CompanyCard