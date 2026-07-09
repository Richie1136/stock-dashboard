import { useState, useEffect } from 'react'
import './MetricsGrid.css'

const MetricsGrid = ({ symbol }) => {

    const [companyKeyMetrics, setCompanyKeyMetrics] = useState({})

    useEffect(() => {
        if (!symbol) return
        try {
            const getCompanyKeyMetrics = async () => {
                const response = await fetch(`http://localhost:5001/api/metrics/${symbol}`)
                const data = await response.json()
                setCompanyKeyMetrics(data)
            }
            getCompanyKeyMetrics()
        } catch (err) {
            console.log(err)
        }
    }, [symbol])

    const metrics = companyKeyMetrics.metric ?? {}

    const marketCap = (cap) => {
        if (cap >= 1_000_000) {
            return `${(cap / 1000000)?.toFixed(2)}T`
        } else if (cap >= 1_000) {
            return `${(cap / 1000)?.toFixed(2)}B`
        } else {
            return `${cap?.toFixed(2)}M`
        }
    }
    const { ['52WeekHigh']: week52High, ['52WeekLow']: week52Low, marketCapitalization, peTTM } = metrics

    const keyMetricsData = [
        { label: "Market Capital", value: marketCap(marketCapitalization), prefix: "$" },
        { label: "52 Week High", value: week52High?.toFixed(2), prefix: "$" },
        { label: "52 Week Low", value: week52Low?.toFixed(2), prefix: "$" },
        { label: "P/E Ratio", value: peTTM.toFixed(2) }
    ]

    return (
        <div className='card metrics-grid'>
            Key Metrics
            {!symbol && <h4>{"Search for a stock to view key metrics."}</h4>}
            {symbol && keyMetricsData?.map(({ label, value, prefix = "" }) => {
                return (
                    <div key={label}>
                        <h4>
                            {label} {prefix}{value}
                        </h4>
                    </div>
                )
            })}
        </div>
    )
}

export default MetricsGrid