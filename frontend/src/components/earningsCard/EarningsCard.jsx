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

    const companyEarningsData = companyEarnings.upcoming
    const earningsHistory = companyEarnings.history ?? []

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

    const { date, estimated_eps } = companyEarningsData ?? {}

    return (
        <div className='card earnings-card'>
            <h1>Upcoming Earnings</h1>
            <div className='earnings-metrics'>
                <span className='metric-label'>
                    Next Earning Date:
                </span>
                <span className='metric-value'>
                    {date ? formatDate(date) : "N/A"}
                </span>
                <span className='metric-label'>
                    Estimated Quarterly Earnings Per Share:
                </span>
                <span className='metric-value'>
                    {estimated_eps !== null ? formatLargePriceValue(estimated_eps) : "N/A"}
                </span>
            </div>
            {earningsHistory.length > 0 && (
                <div className='earnings-chart'>
                    <h2>Earnings History</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={earningsHistory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={formatDate} />
                            <YAxis tickFormatter={formatLargePriceValue} />

                            <Tooltip />
                            <Legend />

                            <Bar dataKey="estimated_eps" name="Estimated EPS" fill='#8884d8' />
                            <Bar dataKey="actual_eps" name="Actual EPS" fill='#82ca9d' />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}

export default EarningsCard