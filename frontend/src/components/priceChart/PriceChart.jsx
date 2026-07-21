import { useState, useEffect } from 'react'
import './PriceChart.css'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const PriceChart = ({ symbol }) => {

    const [companyDailyPrice, setCompanyDailyPrice] = useState(null)


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

    // console.log(companyDailyPrice)

    const dailyPrices = companyDailyPrice?.['Time Series (Daily)'] ?? {}

    const chartData = Object.entries(dailyPrices).map(([date, prices]) => ({
        date: date,
        close: Number(prices["4. close"])
    }))

    return (
        <div className='card chart-card'>
        </div>
    )
}

export default PriceChart