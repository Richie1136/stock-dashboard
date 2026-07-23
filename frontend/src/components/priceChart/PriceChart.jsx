import { useState, useEffect } from 'react'
import './PriceChart.css'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const PriceChart = ({ symbol }) => {

    const [companyDailyPrice, setCompanyDailyPrice] = useState(null)
    const [selectedTimeline, setSelectedTimeline] = useState("ALL")


    useEffect(() => {
        if (!symbol) return

        const fetchPriceCard = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/price-history/${symbol}`)
                const data = await response.json()
                setCompanyDailyPrice(data)
                console.log(data)
            } catch (err) {
                console.error(err)
            }
        }
        fetchPriceCard()
    }, [symbol])

    const dailyPrices = companyDailyPrice?.['Time Series (Daily)'] ?? {}

    const chartData = Object.entries(dailyPrices).map(([date, prices]) => ({
        date: date,
        close: Number(prices["4. close"])
    }))

    if (!symbol) {
        return <div className='card company-card'>
            <h3>{"Price Chart"}</h3>
            <p>{"Search for a stock to display company price chart."}</p>
        </div>
    }

    const formatDate = (date) => {
        return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit"
        })
    }

    const formatNumbers = (value) => value.toFixed(2)

    const last5Day = chartData.slice(-5)
    const last10Day = chartData.slice(-10)
    const lastOneMonth = chartData.slice(-22)
    const lastThreeMonths = chartData.slice(-63)

    const getSelctedTimeline = (selectedTimeline) => {
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

    return (
        <div className='card chart-card'>
            <div className='timeline-buttons'>
                <button className={selectedTimeline === "5D" ? "active" : ''} onClick={() => setSelectedTimeline("5D")}>{"5D"}</button>
                <button className={selectedTimeline === "10D" ? "active" : ''} onClick={() => setSelectedTimeline("10D")}>{"10D"}</button>
                <button className={selectedTimeline === "1M" ? "active" : ''} onClick={() => setSelectedTimeline("1M")}>{"1M"}</button>
                <button className={selectedTimeline === "3M" ? "active" : ''} onClick={() => setSelectedTimeline("3M")}>{"3M"}</button>
                <button className={selectedTimeline === "MAX" ? "active" : ''} onClick={() => setSelectedTimeline("MAX")}>{"MAX"}</button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getSelctedTimeline(selectedTimeline)} margin={{ right: 25, top: 10, bottom: 20, left: 20 }}>
                    <Line dataKey="close" />
                    <XAxis minTickGap={20} dataKey="date" padding={{ left: 10, right: 20 }} tickMargin={18} tickFormatter={formatDate} />
                    <YAxis padding={{ top: 10, bottom: 15 }} domain={["dataMin", "dataMax"]} tickFormatter={formatNumbers} />
                    <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, "Close"]}
                        labelFormatter={(date) => `Date ${formatDate(date)}`}
                        labelStyle={{ color: '#000' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default PriceChart