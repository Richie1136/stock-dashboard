import { useState, useEffect } from 'react'
import './KeyMetrics.css'

const KeyMetrics = ({ symbol }) => {

    const [companyKeyMetrics, setCompanyKeyMetrics] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

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
                    setCompanyKeyMetrics(false)
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
        if (cap >= 1_000_000) {
            return `${(cap / 1000000)?.toFixed(2)}T`
        } else if (cap >= 1_000) {
            return `${(cap / 1000)?.toFixed(2)}B`
        } else {
            return `${cap?.toFixed(2)}M`
        }
    }
    const { ['52WeekHigh']: week52High, ['52WeekLow']: week52Low, marketCapitalization, peTTM, forwardPE, epsTTM, currentDividendYieldTTM, beta } = metrics

    const keyMetricsData = [
        { label: "Market Cap: ", value: marketCap(marketCapitalization), prefix: "$" },
        { label: "P/E Ratio: ", value: peTTM !== undefined ? peTTM?.toFixed(2) : 'N/A' },
        { label: "Forward P/E: ", value: forwardPE !== undefined ? forwardPE?.toFixed(2) : 'N/A' },
        { label: "Dividend Yield: ", value: currentDividendYieldTTM !== null && currentDividendYieldTTM > 0 ? `${currentDividendYieldTTM?.toFixed(2)}%` : 'N/A' },
        { label: "Beta:", value: beta?.toFixed(2) },
        { label: "Earnings Per Share: ", value: epsTTM !== undefined ? epsTTM?.toFixed(2) : 'N/A', prefix: epsTTM && "$" },
        { label: "52 Week High: ", value: week52High?.toFixed(2), prefix: "$" },
        { label: "52 Week Low: ", value: week52Low?.toFixed(2), prefix: "$" },
    ]

    if (isLoading) {
        <p>Loading Metrics...</p>
    }

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

export default KeyMetrics