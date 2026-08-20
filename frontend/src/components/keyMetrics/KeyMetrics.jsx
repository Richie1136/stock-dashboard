import { useState, useEffect } from 'react'
import './KeyMetrics.css'
import Loading from '../loading/Loading'

import { formatLargePriceValue, formatMetrics, formatMarketCap, formatNetAssets, convertDecimalToPercentage, getSymbol } from '../../helperFunctions'
import { apiBaseUrl } from '../../utils/apiConfig'

const KeyMetrics = ({ symbol, assetType, etfProfile }) => {

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
                const response = await fetch(`${apiBaseUrl}/metrics/${symbol}`,
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


    const { ['52WeekHigh']: week52High, ['52WeekLow']: week52Low, marketCapitalization, peTTM, forwardPE, epsTTM, currentDividendYieldTTM, beta } = metrics ?? {}
    const { dividend_yield, net_assets, net_expense_ratio, holdings, portfolio_turnover } = fundMetrics ?? {}

    const convertNetAssetToNumber = net_assets !== undefined && net_assets !== null ? Number(net_assets) : "N/A"

    // Keeping display metadata together lets stocks and funds share one render shape.
    const keyMetricsData = [
        { label: "Market Cap: ", value: formatMarketCap(marketCapitalization), prefix: getSymbol("$", marketCapitalization) },
        { label: "P/E Ratio: ", value: formatMetrics(peTTM) },
        { label: "Forward P/E: ", value: formatMetrics(forwardPE) },
        { label: "Dividend Yield: ", value: `${formatMetrics(currentDividendYieldTTM)}`, suffix: getSymbol("%", currentDividendYieldTTM) },
        { label: "Beta: ", value: formatMetrics(beta) },
        { label: "Earnings Per Share: ", value: epsTTM?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), prefix: getSymbol("$", epsTTM) },
        {
            label: "52 Week High: ", value: formatLargePriceValue(week52High)
        },
        { label: "52 Week Low: ", value: formatLargePriceValue(week52Low) },
    ]


    const keyFundMetrics = [
        { label: "Dividend Yield: ", value: `${formatMetrics(convertDecimalToPercentage(dividend_yield))}`, suffix: getSymbol("%", dividend_yield) },
        { label: "Beta: ", value: formatMetrics(beta) },
        { label: "Net Assets: ", value: formatNetAssets(convertNetAssetToNumber), prefix: getSymbol("$", convertNetAssetToNumber) },
        { label: "Expense Ratio: ", value: `${formatMetrics(convertDecimalToPercentage(net_expense_ratio))}`, suffix: getSymbol("%", net_expense_ratio) },
        { label: "52 Week High: ", value: formatMetrics(week52High), prefix: getSymbol("$", week52High) },
        { label: "52 Week Low: ", value: formatMetrics(week52Low), prefix: getSymbol("$", week52Low) },
        { label: "Holdings: ", value: holdings ? holdings.length.toLocaleString("en-US") : "N/A" },
        { label: "Portfolio Turnover: ", value: `${formatMetrics(convertDecimalToPercentage(portfolio_turnover))}`, suffix: getSymbol("%", portfolio_turnover) }
    ]

    const metricsToDisplay = assetType === 'Common Stock' ? keyMetricsData : keyFundMetrics

    return (
        <div className='card metrics-card'>
            <h2>Key Metrics</h2>
            {isLoading && <Loading />}
            {!symbol && assetType === 'Common Stock' && <h4>{"Search for a stock or ETF to view key metrics."}</h4>}
            {error && <p>{error}</p>}
            {!error && symbol && (
                <div className='metrics-grid'>
                    {metricsToDisplay?.map(({ label, value, prefix = "", suffix = "" }) => {
                        return (
                            <div className='metric-item' key={label}>
                                <span className='metric-label'>
                                    {label}
                                </span>
                                <span className='metric-value'>
                                    {prefix}{value}{suffix}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default KeyMetrics