import { useState, useEffect } from 'react'
import { apiBaseUrl } from '../../utils/apiConfig'
import { formatDate, formatLargePriceValue, formatNetAssets } from '../../helperFunctions'
import Loading from '../loading/Loading'
import './EarningsCard.css'

const formatEarningsTime = (hour) => {
    switch (hour) {
        case "amc":
            return "After Market Close"
        case "bmo":
            return "Before Market Open"

        default:
            return "N/A"
    }
}

const EarningsCard = ({ symbol }) => {
    const [companyEarnings, setCompanyEarnings] = useState({})
    const [companyEarningsCardLoading, setCompanyEarningsCardLoading] = useState(false)
    const [companyEarningsError, setCompanyEarningsError] = useState("")

    useEffect(() => {
        const controller = new AbortController()

        const getEarningsCalendarData = async () => {
            try {
                setCompanyEarningsCardLoading(true)
                setCompanyEarningsError("")
                const response = await fetch(`${apiBaseUrl}/company-earnings/${symbol}`,
                    { signal: controller.signal }
                )
                if (!response.ok) {
                    throw new Error(`Earnings Calendar Data request failed with status ${response.status}`
                    )
                }
                const data = await response.json()
                setCompanyEarnings(data)
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error(err)
                    setCompanyEarningsError("Unable to load Company Earnings")
                    setCompanyEarnings({})

                }
            } finally {
                if (!controller.signal.aborted) {
                    setCompanyEarningsCardLoading(false)
                }
            }
        }
        getEarningsCalendarData()
        return () => {
            controller.abort()
        }
    }, [symbol])


    const companyEarningsData = companyEarnings.earningsCalendar?.[0]

    console.log(companyEarningsData)

    if (companyEarningsCardLoading) {
        return (
            <div className="card chart-card">
                <h2>Company Earnings Data</h2>
                <Loading />
            </div>
        )
    }

    if (companyEarningsError) {
        return (
            <div className="card chart-card">
                <h2>Company Earnings Data</h2>
                <p>{companyEarningsError}</p>
            </div>
        )
    }

    if (!companyEarningsData) {
        <div className="card chart-card">
            <h2>No Upcoming Earnings</h2>
            <Loading />
        </div>
    }

    const { date, hour, quarter, epsEstimate, revenueEstimate, year, epsActual } = companyEarningsData ?? {}

    return (
        <div className='card earnings-card'>
            <h1>Upcoming Earnings</h1>
            <div className='earnings-metrics'>
                <span className='metric-label'>
                    Date:
                </span>
                <span className='metric-value'>
                    {formatDate(date)}
                </span>
                <span className='metric-label'>
                    Fiscal Quarter:
                </span>
                <span className='metric-value'>
                    Q{quarter} {year}
                </span>
                <span className='metric-label'>
                    EPS Estimate:
                </span>
                <span className='metric-value'>
                    {formatLargePriceValue(epsEstimate)}
                </span>
                <span className='metric-label'>
                    EPS Actual:
                </span>
                <span className='metric-value'>
                    {formatLargePriceValue(epsActual)}
                </span>
                <span className='metric-label'>
                    Revenue Estimate:
                </span>
                <span className='metric-value'>
                    {formatNetAssets(revenueEstimate)}
                </span>
                <span className='metric-label'>
                    Earnings Time:
                </span>
                <span className='metric-value'>
                    {formatEarningsTime(hour)}
                </span>
            </div>
        </div>
    )
}

export default EarningsCard