import { useState, useEffect } from 'react'
import { apiBaseUrl } from '../../utils/apiConfig'
import { formatDate, formatLargePriceValue } from '../../helperFunctions'
import Loading from '../loading/Loading'
import './EarningsCard.css'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const EarningsCard = ({ symbol }) => {
    const [companyEarnings, setCompanyEarnings] = useState({})
    const [companyEarningsCardLoading, setCompanyEarningsCardLoading] = useState(false)
    const [companyEarningsError, setCompanyEarningsError] = useState("")
    const [selectedEarnings, setSelectedEarnings] = useState(null)

    useEffect(() => {
        const controller = new AbortController()
        setSelectedEarnings(null)
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

    const companyEarningsData = companyEarnings.upcoming ?? {}
    const earningsHistory = companyEarnings.history ?? []

    const handleEarnings = (state) => {
        if (state?.isTooltipActive && state.activeIndex != null) {
            setSelectedEarnings(earningsHistory[state.activeIndex])

        }
    }

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

    const { actual_eps, date, estimated_eps, surprise_percent } = selectedEarnings ?? {}

    return (
        <div className='card earnings-card'>
            <h1>Upcoming Earnings</h1>
            <div className='earnings-metrics'>
                <span className='metric-label'>
                    Next Earning Date:
                </span>
                <span className='metric-value'>
                    {companyEarningsData?.date != null ? formatDate(companyEarningsData.date) : "N/A"}
                </span>
                <span className='metric-label'>
                    Estimated Quarterly Earnings Per Share:
                </span>
                <span className='metric-value'>
                    {companyEarningsData?.estimated_eps != null ? formatLargePriceValue(companyEarningsData.estimated_eps) : "N/A"}
                </span>
            </div>
            {earningsHistory.length > 0 ? (
                <div className='earnings-chart'>
                    <h2>Earnings History</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={earningsHistory} onMouseMove={handleEarnings}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={formatDate} padding={{ left: 80, right: 80 }} />
                            <YAxis tickFormatter={formatLargePriceValue} />

                            <Tooltip content={() => null} cursor={{ fill: "#374151" }} />
                            <Legend />

                            <Bar dataKey="estimated_eps" name="Estimated EPS" fill='#8884d8' />
                            <Bar dataKey="actual_eps" name="Actual EPS" fill='#82ca9d' />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className='earnings-history-details'>
                        <span className='metric-label'>Date:</span>
                        <span className='metric-value'>{date ? formatDate(date) : "N/A"}</span>
                        <span className='metric-label'>Estimated EPS:</span>
                        <span className='metric-value'>{estimated_eps != null ? formatLargePriceValue(estimated_eps) : "N/A"}</span>
                        <span className='metric-label'>Actual EPS: </span>
                        <span className='metric-value'>{actual_eps != null ? formatLargePriceValue(actual_eps) : "N/A"}</span>
                        <span className='metric-label'>Earnings Per Share vs. Expectations:</span>
                        <span className={`metric-value ${surprise_percent > 0 ? "positive" : surprise_percent < 0 ? "negative" : "neutral"}`}>{surprise_percent != null ? surprise_percent.toFixed(2) + "%" : "N/A"}</span>
                    </div>
                </div>
            ) : (
                <p className='no-earnings-history'>No historical earnings data available.</p>
            )}
        </div>
    )
}

export default EarningsCard