import { useState } from 'react'
import './PriceChart.css'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Loading from '../loading/Loading'
import { CustomTooltip } from './customTooltip'
import { formatLargePriceValue } from '../../helperFunctions/formatLargePriceValue'
import { ASSET_TYPES } from '../../constants/assetTypes'

const PriceChart = ({ symbol, assetType, finishedEtfSymbol, companyDailyPrice, isLoading, error }) => {

    const [selectedTimeline, setSelectedTimeline] = useState("ALL")

    // Normalize the provider's date-keyed response into the array Recharts expects.
    const dailyPrices = companyDailyPrice?.['Time Series (Daily)'] ?? {}

    const chartData = Object.entries(dailyPrices).map(([date, prices]) => ({
        date: date,
        close: Number(prices["4. close"])
    }))

    if (!symbol) {
        return <div className='card chart-card'>
            <h3>{"Price Chart"}</h3>
            <p>{"Search for a stock or fund to display the price chart data."}</p>
        </div>
    }

    const formatDate = (date) => {
        return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
            month: "long",
            day: "numeric",
            year: "numeric"
        })
    }

    // Approximate month ranges with trading days rather than calendar days.
    const last5Day = chartData.slice(-5)
    const last10Day = chartData.slice(-10)
    const lastOneMonth = chartData.slice(-22)
    const lastThreeMonths = chartData.slice(-63)

    const getSelectedTimeline = (selectedTimeline) => {
        switch (selectedTimeline) {
            case "10D":
                return last10Day
            case "5D":
                return last5Day
            case "1M":
                return lastOneMonth
            case "3M":
                return lastThreeMonths
            default:
                return chartData
        }
    }

    if (isLoading) {
        return (
            <div className="card chart-card">
                <h2>Price Chart</h2>
                <Loading />
            </div>
        )
    }

    if (error) {
        return (
            <div className="card chart-card">
                <h2>Price Chart</h2>
                <p>{error}</p>
            </div>
        )
    }

    return (
        <div className='card chart-card'>
            <div className='chart-header'>
                <h3>Price Chart</h3>
                <div className='timeline-buttons'>
                    <button className={selectedTimeline === "5D" ? "active" : ''} onClick={() => setSelectedTimeline("5D")}>{"5D"}</button>
                    <button className={selectedTimeline === "10D" ? "active" : ''} onClick={() => setSelectedTimeline("10D")}>{"10D"}</button>
                    <button className={selectedTimeline === "1M" ? "active" : ''} onClick={() => setSelectedTimeline("1M")}>{"1M"}</button>
                    <button className={selectedTimeline === "3M" ? "active" : ''} onClick={() => setSelectedTimeline("3M")}>{"3M"}</button>
                    <button className={selectedTimeline === "ALL" ? "active" : ''} onClick={() => setSelectedTimeline("ALL")}>{"ALL"}</button>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={getSelectedTimeline(selectedTimeline)} margin={{ right: 12, top: 8, bottom: 18, left: 0 }}>
                    <defs>
                        <linearGradient id='priceGradient' x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor='#60a5fa' stopOpacity={0.45} />
                            <stop offset="60%" stopColor='#60a5fa' stopOpacity={0.18} />
                            <stop offset="100%" stopColor='#60a5fa' stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke='#374151' strokeDasharray="3 3" vertical={false} opacity={0.25} />
                    <XAxis minTickGap={20} dataKey="date" padding={{ left: 15, right: 20 }} tickMargin={18} tickFormatter={formatDate} />
                    {/* Fit the axis to the selected range so short-term price movement remains visible. */}
                    <YAxis width={75} padding={{ top: 10, bottom: 15 }} domain={["dataMin", "dataMax"]} tickFormatter={formatLargePriceValue} />
                    <Tooltip content={<CustomTooltip />} formatDate={formatDate} />
                    <Area fill="url(#priceGradient)" dot={false} activeDot={{ r: 6, fill: '#ffffff', stroke: '#60a5fa', strokeWidth: 3 }} strokeWidth={2.5} type="monotone" dataKey="close" stroke='#60a5fa' />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

export default PriceChart
