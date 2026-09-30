import { useState, useEffect } from 'react'
import './KeyMetrics.css'
import Loading from '../loading/Loading'

import { formatLargePriceValue, formatMetrics, formatMarketCap, formatNetAssets, convertDecimalToPercentage, getSymbol } from '../../helperFunctions'
import { apiBaseUrl } from '../../utils/apiConfig'
import { ASSET_TYPES, isStockAssetType } from '../../constants/assetTypes'

const KeyMetrics = ({ symbol, assetType, etfProfile, currency, totalAmountOfHoldings, setFinishedMutualFundExpenseRatioSymbol, setFinishedKeyMetricsSymbol, setFinishedKeyMetricsDividend, isLoading, error }) => {

    const [companyKeyMetrics, setCompanyKeyMetrics] = useState(null)
    const [companyMetricsLoading, setCompanyMetricsLoading] = useState(false)
    const [companyMetricsError, setCompanyMetricsError] = useState("")
    const [fundDividendYield, setFundDividendYield] = useState(null)
    const [mutualFundExpenseRatio, setMutualFundExpenseRatio] = useState(null)
    const [mutualFundExpenseRatioLoading, setMutualFundExpenseRatioLoading] = useState(false)
    const [mutualFundExpenseRatioSymbol, setMutualFundExpenseRatioSymbol] = useState("")
    const [mutualFundExpenseRatioError, setMutualFundExpenseRatioError] = useState("")


    const isStock = isStockAssetType(assetType)

    useEffect(() => {
        if (!symbol || (assetType !== ASSET_TYPES.ETP && !isStock)) return

        const controller = new AbortController()

        const getCompanyKeyMetrics = async () => {
            try {
                setCompanyMetricsLoading(true)
                setCompanyMetricsError("")
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
                    setCompanyMetricsError("Unable to load company metrics")
                    setCompanyKeyMetrics(null)
                }
            } finally {
                if (!controller.signal.aborted) {
                    setCompanyMetricsLoading(false)
                    setFinishedKeyMetricsSymbol(symbol)
                }
            }
        }
        getCompanyKeyMetrics()

        return () => {
            controller.abort()
        }
    }, [symbol, assetType, setFinishedKeyMetricsSymbol])

    useEffect(() => {
        if (!symbol || assetType !== ASSET_TYPES.MUTUAL_FUND) return

        const controller = new AbortController()

        const getMutualFundsExpenseRatio = async () => {
            try {
                setMutualFundExpenseRatioLoading(true)
                setMutualFundExpenseRatioError("")

                const response = await fetch(`${apiBaseUrl}/mutual-fund/expense-ratio/${symbol}`, { signal: controller.signal })

                if (!response.ok) {
                    throw new Error(`Metrics request failed with status ${response.status}`
                    )
                }
                const expenseRatioRate = await response.json()
                setMutualFundExpenseRatio(expenseRatioRate)
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error(err)
                    setMutualFundExpenseRatioError("Unable to load Muutal Fund expense ratio data")
                }
            } finally {
                if (!controller.signal.aborted) {
                    setFinishedMutualFundExpenseRatioSymbol(symbol)
                    setMutualFundExpenseRatioLoading(false)
                }
            }
        }
        getMutualFundsExpenseRatio()

        return () => {
            controller.abort()
        }
    }, [symbol, assetType])

    useEffect(() => {
        if (!symbol || (isStock)) return

        const controller = new AbortController()

        const getFundsDividendYield = async () => {
            try {
                setCompanyMetricsLoading(true)
                const response = await fetch(`${apiBaseUrl}/dividends/${symbol}`,
                    { signal: controller.signal }
                )
                if (!response.ok) {
                    throw new Error(`Metrics request failed with status ${response.status}`
                    )
                }
                const data = await response.json()
                setFundDividendYield(data)
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error(err)
                    setFundDividendYield(null)
                }
            } finally {
                if (!controller.signal.aborted) {
                    setFinishedKeyMetricsDividend(symbol)
                }
            }
        }
        getFundsDividendYield()

        return () => {
            controller.abort()
        }
    }, [symbol, assetType, setFinishedKeyMetricsDividend])

    const metrics = companyKeyMetrics ?? {}
    // Fund-specific fields comes from the profile request owned by App; price fields
    // such as beta and 52-week range still come from this component's metrics request.
    const fundMetrics = etfProfile ?? {}

    const mutualFundExpenseRatios = mutualFundExpenseRatio ?? {}

    const { assets, fees, risk_ratios } = mutualFundExpenseRatios?.summary ?? {}

    const { ['52WeekHigh']: week52High, ['52WeekLow']: week52Low, marketCapitalization, peTTM, forwardPE, epsTTM, currentDividendYieldTTM, beta } = metrics ?? {}
    const { net_assets, net_expense_ratio, portfolio_turnover } = fundMetrics ?? {}

    // The ETF provider serializes net assets as a numeric string.
    const convertNetAssetToNumber = net_assets !== undefined && net_assets !== null && assetType === ASSET_TYPES.ETP ? Number(net_assets) : assetType === ASSET_TYPES.MUTUAL_FUND ? Number(assets?.net_assets_usd) : "N/A"

    // Stocks data.
    const keyMetricsStockData = [
        { label: "Market Cap: ", value: formatMarketCap(marketCapitalization, currency), prefix: getSymbol("$", marketCapitalization) },
        { label: "P/E Ratio: ", value: formatMetrics(peTTM) },
        { label: "Forward P/E: ", value: formatMetrics(forwardPE) },
        { label: "Dividend Yield: ", value: `${formatMetrics(currentDividendYieldTTM)}`, suffix: getSymbol("%", currentDividendYieldTTM) },
        { label: "Beta: ", value: formatMetrics(beta) },
        { label: "Earnings Per Share: ", value: epsTTM != null ? epsTTM?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "N/A", prefix: getSymbol("$", epsTTM) },
        {
            label: "52 Week High: ", value: formatLargePriceValue(week52High)
        },
        { label: "52 Week Low: ", value: formatLargePriceValue(week52Low) },
    ]

    // Mutual Fund Data

    const keyMetricsMutualFund = [
        { label: "Dividend Yield: ", value: Number.isNaN(fundDividendYield) ? "N/A" : `${(fundDividendYield?.toFixed(2))}`, suffix: getSymbol("%", fundDividendYield) },
        { label: "Beta: ", value: formatMetrics(risk_ratios?.beta_5y) },
        { label: "Net Assets: ", value: formatNetAssets(convertNetAssetToNumber), prefix: getSymbol("$", convertNetAssetToNumber) },
        { label: "Expense Ratio: ", value: fees?.net_expense_ratio_pct != null ? `${fees?.net_expense_ratio_pct}` : "N/A", suffix: getSymbol("%", fees?.net_expense_ratio_pct) },
        { label: "Holdings: ", value: totalAmountOfHoldings != null ? totalAmountOfHoldings.toLocaleString("en-US") : "N/A" },
        { label: "Portfolio Turnover: ", value: `${formatMetrics(fees?.portfolio_turnover_pct)}`, suffix: getSymbol("%", fees?.portfolio_turnover_pct) }
    ]

    // ETF Data

    const keyMetricsEtf = [
        { label: "Dividend Yield: ", value: Number.isNaN(fundDividendYield) ? "N/A" : `${(fundDividendYield?.toFixed(2))}`, suffix: getSymbol("%", fundDividendYield) },
        { label: "Beta: ", value: formatMetrics(beta) },
        { label: "Net Assets: ", value: formatNetAssets(convertNetAssetToNumber), prefix: getSymbol("$", convertNetAssetToNumber) },
        { label: "Expense Ratio: ", value: `${formatMetrics(convertDecimalToPercentage(net_expense_ratio))}`, suffix: getSymbol("%", net_expense_ratio) },
        { label: "52 Week High: ", value: formatMetrics(week52High), prefix: getSymbol("$", week52High) },
        { label: "52 Week Low: ", value: formatMetrics(week52Low), prefix: getSymbol("$", week52Low) },
        { label: "Holdings: ", value: totalAmountOfHoldings != null ? totalAmountOfHoldings.toLocaleString("en-US") : "N/A" },
        { label: "Portfolio Turnover: ", value: `${formatMetrics(convertDecimalToPercentage(portfolio_turnover))}`, suffix: getSymbol("%", portfolio_turnover) }
    ]

    const metricsToDisplay = isStock ? keyMetricsStockData : assetType === ASSET_TYPES.ETP ? keyMetricsEtf : keyMetricsMutualFund
    const metricLoader = assetType === ASSET_TYPES.MUTUAL_FUND ? isLoading : companyMetricsLoading
    const metricError = assetType === ASSET_TYPES.MUTUAL_FUND ? error : companyMetricsError

    if (metricLoader) {
        return (
            <div className="card metrics-card">
                <h2>Key Metrics</h2>
                <Loading />
            </div>
        )
    }

    if (metricError) {
        return (
            <div className="card metrics-card">
                <h2>Key Metrics</h2>
                <p>{metricError}</p>
            </div>
        )
    }

    return (
        <div className='card metrics-card'>
            <h2>Key Metrics</h2>
            {!symbol && isStock && <h4>{"Search for a stock or ETF to view key metrics."}</h4>}
            {symbol && (
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
