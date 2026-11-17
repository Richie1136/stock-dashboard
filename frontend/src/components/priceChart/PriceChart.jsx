import { useState } from 'react'
import './PriceChart.css'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Loading from '../loading/Loading'
import { CustomTooltip } from './customTooltip'
import { formatLargePriceValue } from '../../helperFunctions/formatLargePriceValue'
import { formatDate } from '../../helperFunctions'

const PriceChart = ({ symbol, companyDailyPrice, isLoading, error, metadata }) => {

    const [selectedTimeline, setSelectedTimeline] = useState("1Y")

    // Extract closing prices and sort oldest first for timeline slices and return calculations.
    const dailyPrices = companyDailyPrice ?? {}

    const chartData = Object.entries(dailyPrices)?.map((item) => {

        const { close, date } = item[1] ?? {}

        return (
            { close: close, date: date }
        )
    }).sort((a, b) => new Date(a.date) - new Date(b.date))

    if (!symbol) {
        return <div className='card chart-card'>
            <h3>{"Price Chart"}</h3>
            <p>{"Search for a stock or fund to display the price chart data."}</p>
        </div>
    }

    // 5D uses the latest five trading sessions in the returned data.
    const last5Day = chartData.slice(-5)

    const getSelectedTimeline = (selectedTimeline) => {
        // All includes every returned price, so newer funds may have less history.
        if (selectedTimeline === "ALL") return chartData
        if (selectedTimeline === "5D") return last5Day

        // Use today's date in the browser's timezone as the calendar-range cutoff.
        // Midnight includes a price that falls exactly on the starting date.

        const startDate = new Date()
        startDate.setHours(0, 0, 0, 0)

        if (selectedTimeline === "YTD") {
            // January is month 0. YTD starts on January 1 of the current year.
            startDate.setMonth(0, 1)
        } else {
            const monthsBack = {
                "1M": 1,
                "3M": 3,
                "6M": 6,
                "1Y": 12,
                "5Y": 60
            }

            const originalDay = startDate.getDate()

            // Start on day 1 to avoid overflowing shorter months.

            startDate.setDate(1)
            startDate.setMonth(startDate.getMonth() - (monthsBack[selectedTimeline] ?? 12))

            const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()

            // Clamp dates such as March 31 to the last valid day of the target month.
            startDate.setDate(Math.min(originalDay, lastDayOfMonth))
        }

        return chartData.filter(({ date }) => {
            // Parse each price at local midnight so it uses the same timezone as the cutoff.
            const priceDate = new Date(`${date.slice(0, 10)}T00:00:00`)
            return priceDate >= startDate
        })
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

    const fundReturns = getSelectedTimeline(selectedTimeline)

    // Measure the closing-price change across the selected range; dividends are excluded.
    const firstPrice = fundReturns.length > 0 ? fundReturns[0].close : null
    const lastPrice = fundReturns.length > 0 ? fundReturns[fundReturns.length - 1].close : null
    const fundAmountReturned = fundReturns.length > 0 ? ((lastPrice - firstPrice) / firstPrice * 100) : null

    const convertfundAmountReturnedToString = fundAmountReturned?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    // The latest price date identifies the trading session. This timestamp identifies the refresh.
    // Display the stored UTC refresh time in Eastern time.
    const refreshedAt = metadata?.last_refreshed_at
        ? new Date(metadata.last_refreshed_at).toLocaleString("en-US", {
            timeZone: "America/New_York",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short",
        })
        : null

    const returnedSymbol = fundAmountReturned > 0 ? "+" : ""

    const returnedPercentageValue = fundAmountReturned !== null ? `${returnedSymbol}${convertfundAmountReturnedToString}%`
        : null

    return (
        <div className='card chart-card'>
            <div className='chart-header'>
                <div className='chart-title'>
                    <h3>Price Chart</h3>
                    <span className={`chart-return ${fundAmountReturned > 0 ? "positive" : fundAmountReturned < 0 ? "negative" : "neutral"}`}>
                        {returnedPercentageValue}
                    </span>
                </div>
                <div className='timeline-buttons'>
                    <button className={selectedTimeline === "5D" ? "active" : ''} onClick={() => setSelectedTimeline("5D")}>{"5D"}</button>
                    <button className={selectedTimeline === "1M" ? "active" : ''} onClick={() => setSelectedTimeline("1M")}>{"1M"}</button>
                    <button className={selectedTimeline === "3M" ? "active" : ''} onClick={() => setSelectedTimeline("3M")}>{"3M"}</button>
                    <button className={selectedTimeline === "6M" ? "active" : ''} onClick={() => setSelectedTimeline("6M")}>{"6M"}</button>
                    <button className={selectedTimeline === "YTD" ? "active" : ''} onClick={() => setSelectedTimeline("YTD")}>{"YTD"}</button>
                    <button className={selectedTimeline === "1Y" ? "active" : ''} onClick={() => setSelectedTimeline("1Y")}>{"1Y"}</button>
                    <button className={selectedTimeline === "5Y" ? "active" : ''} onClick={() => setSelectedTimeline("5Y")}>{"5Y"}</button>
                    <button className={selectedTimeline === "ALL" ? "active" : ''} onClick={() => setSelectedTimeline("ALL")}>All</button>
                </div>
            </div>
            {metadata && (
                <p className="chart-freshness">
                    Latest price date: {formatDate(metadata.latest_price_date)}
                    {refreshedAt && <> · Last refreshed: {refreshedAt}</>}
                    {metadata.from_cache && <> · Saved prices</>}
                </p>
            )}
            {metadata?.warning && <p>Unable to refresh. Showing previously saved prices.</p>}
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={fundReturns} margin={{ right: 12, top: 8, bottom: 18, left: 8 }}>
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
