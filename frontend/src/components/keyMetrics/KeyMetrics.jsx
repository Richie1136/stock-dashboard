import { useState, useEffect } from 'react'
import './KeyMetrics.css'
import Loading from '../loading/Loading'

const KeyMetrics = ({ symbol, assetType, etfProfile }) => {

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
    }, [symbol, assetType])

    const metrics = companyKeyMetrics ?? {}
    const fundMetrics = etfProfile ?? {}

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

    const fundNetAssets = (netAsset) => {
        if (netAsset !== null && netAsset !== undefined) {
            if (netAsset > 1_000_000_000_000) {
                return `${(netAsset / 1_000_000_000_000)?.toFixed(2)}T`
            } else if (netAsset > 1_000_000_000) {
                return `${(netAsset / 1_000_000_000)?.toFixed(2)}B`
            } else {
                return `${netAsset?.toFixed(2)}M`
            }
        }
        return "N/A"
    }

    const { ['52WeekHigh']: week52High, ['52WeekLow']: week52Low, marketCapitalization, peTTM, forwardPE, epsTTM, currentDividendYieldTTM, beta } = metrics ?? {}
    const { dividend_yield, net_assets, net_expense_ratio, holdings, portfolio_turnover } = fundMetrics ?? {}

    const convertNetAssetToNumber = net_assets !== undefined && net_assets !== null ? Number(net_assets) : "N/A"

    const convertkeyMetricsData = (keyMetric) => {
        if (keyMetric !== undefined && keyMetric !== null) {
            return Number(keyMetric) * 100
        }
        return "N/A"
    }

    const getPrefix = (metric) => {
        if (metric !== null && metric !== undefined) {
            return metric
        }
        return ""
    }

    const getSuffix = (metric) => {
        if (metric !== null && metric !== undefined) {
            return metric
        }
        return ""
    }




    const keyMetricsData = [
        { label: "Market Cap: ", value: marketCap(marketCapitalization), prefix: getPrefix("$"), suffix: getSuffix("") },
        { label: "P/E Ratio: ", value: metricFormatter(peTTM) },
        { label: "Forward P/E: ", value: metricFormatter(forwardPE) },
        { label: "Dividend Yield: ", value: `${metricFormatter(currentDividendYieldTTM)}`, prefix: getPrefix(""), suffix: getSuffix("%") },
        { label: "Beta:", value: metricFormatter(beta) },
        { label: "Earnings Per Share: ", value: metricFormatter(epsTTM), prefix: getPrefix("$"), suffix: getSuffix("") },
        { label: "52 Week High: ", value: metricFormatter(week52High), prefix: getPrefix("$"), suffix: getSuffix("") },
        { label: "52 Week Low: ", value: metricFormatter(week52Low), prefix: getPrefix("$"), suffix: getSuffix("") },
    ]

    const keyFundMetrics = [
        { label: "Dividend Yield: ", value: dividend_yield > 0.0 ? `${metricFormatter(convertkeyMetricsData(dividend_yield))}` : "N/A", prefix: getPrefix(""), suffix: getSuffix("%") },
        { label: "Beta", value: metricFormatter(beta) },
        { label: "Net Assets: ", value: convertNetAssetToNumber > 0.0 ? fundNetAssets(convertNetAssetToNumber) : "N/A", prefix: getPrefix("$"), suffix: getSuffix("") },
        { label: "Expense Ratio: ", value: net_expense_ratio > 0.0 ? `${metricFormatter(convertkeyMetricsData(net_expense_ratio))}` : "N/A", prefix: getPrefix(""), suffix: getSuffix("%") },
        { label: "52 Week High: ", value: metricFormatter(week52High), prefix: getPrefix("$"), suffix: getSuffix("") },
        { label: "52 Week Low: ", value: metricFormatter(week52Low), prefix: getPrefix("$"), suffix: getSuffix("") },
        { label: "Holdings: ", value: holdings ? holdings.length.toLocaleString("en-US") : "N/A" },
        { label: "Portfolio Turnover: ", value: portfolio_turnover > 0.0 ? `${metricFormatter(convertkeyMetricsData(portfolio_turnover))}` : "N/A", prefix: getPrefix(""), suffix: getSuffix("%") }
    ]

    return (
        <div className='card metrics-grid'>
            Key Metrics
            {isLoading && <Loading />}
            {!symbol && assetType === 'Common Stock' && <h4>{"Search for a stock or ETF to view key metrics."}</h4>}
            {error && <p>{error}</p>}
            {!error && symbol && assetType === 'Common Stock' ? keyMetricsData?.map(({ label, value, prefix = "", suffix = "" }) => {
                return (
                    <div key={label}>
                        <h4>
                            {label} {prefix}{value}{suffix}
                        </h4>
                    </div>
                )
            }) : (
                !error && symbol && keyFundMetrics?.map(({ label, value, prefix = "", suffix = "" }) => {
                    return (
                        <div key={label}>
                            <h4>
                                {label} {prefix}{value}{suffix}
                            </h4>
                        </div>
                    )
                })
            )}
        </div>
    )
}

export default KeyMetrics