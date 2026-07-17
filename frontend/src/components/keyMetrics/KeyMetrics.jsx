import { useState, useEffect } from 'react'
import './KeyMetrics.css'

const KeyMetrics = ({ symbol }) => {

    const [companyKeyMetrics, setCompanyKeyMetrics] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const metricFormatter = (metric) => {
        if (metric !== null && metric !== undefined) {
            return metric.toFixed(2)
        }
        return "N/A"
    }

    useEffect(() => {
        if (!symbol) return

        const controller = new AbortController()

        const getCompanyKeyMetrics = async () => {
            try {
                setIsLoading(true)
                setError("")
                const response = await fetch(`http://localhost:5001/api/metrics/${symbol}`,
                    { signal: controller.signal }
                )
                if (!response.ok) {
                    throw new Error(`Metrics request failed with status ${response.status}`
                    )
                }
                const data = await response.json()
                setCompanyKeyMetrics(data)
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error(err)
                    setError("Unable to load company metrics")
                    setCompanyKeyMetrics(null)
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }
        getCompanyKeyMetrics()

        return () => {
            controller.abort()
        }
    }, [symbol])

    const metrics = companyKeyMetrics ?? {}

    const marketCap = (cap) => {
        if (cap !== null && cap !== undefined) {
            if (cap >= 1_000_000) {
                return `${(cap / 1000000)?.toFixed(2)}T`
            } else if (cap >= 1_000) {
                return `${(cap / 1000)?.toFixed(2)}B`
            } else {
                return `${cap?.toFixed(2)}M`
            }
        }
        return "N/A"
    }
    const { ['52WeekHigh']: week52High, ['52WeekLow']: week52Low, marketCapitalization, peTTM, forwardPE, epsTTM, currentDividendYieldTTM, beta } = metrics

    const keyMetricsData = [
        { label: "Market Cap: ", value: marketCap(marketCapitalization), prefix: "$" },
        { label: "P/E Ratio: ", value: metricFormatter(peTTM) },
        { label: "Forward P/E: ", value: metricFormatter(forwardPE) },
        { label: "Dividend Yield: ", value: currentDividendYieldTTM > 0.0 ? `${metricFormatter(currentDividendYieldTTM)}%` : 'N/A' },
        { label: "Beta:", value: metricFormatter(beta) },
        { label: "Earnings Per Share: ", value: metricFormatter(epsTTM), prefix: epsTTM !== null && epsTTM !== undefined ? "$" : "" },
        { label: "52 Week High: ", value: metricFormatter(week52High), prefix: "$" },
        { label: "52 Week Low: ", value: metricFormatter(week52Low), prefix: "$" },
    ]

    return (
        <div className='card metrics-grid'>
            Key Metrics
            {isLoading && <p>{"Loading Metrics...."}</p>}
            {!symbol && <h4>{"Search for a stock to view key metrics."}</h4>}
            {error && <p>{error}</p>}
            {!error && symbol && keyMetricsData?.map(({ label, value, prefix = "" }) => {
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

export default KeyMetrics