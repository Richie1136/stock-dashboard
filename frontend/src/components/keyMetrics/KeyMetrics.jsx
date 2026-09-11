import { useState, useEffect } from 'react'
import './KeyMetrics.css'
import Loading from '../loading/Loading'

import { formatLargePriceValue, formatMetrics, formatMarketCap, formatNetAssets, convertDecimalToPercentage, getSymbol } from '../../helperFunctions'
import { apiBaseUrl } from '../../utils/apiConfig'
import { ASSET_TYPES, isStockAssetType } from '../../constants/assetTypes'

const KeyMetrics = ({ symbol, assetType, etfProfile, currency }) => {

    const [companyKeyMetrics, setCompanyKeyMetrics] = useState(null)
    const [mutualFundHoldings, setMutualFundHoldings] = useState(null)
    const [mutualFundExpenseRatio, setMutualFundExpenseRatio] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const isStock = isStockAssetType(assetType)


    useEffect(() => {
        if (!symbol || !isStock) return

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


    useEffect(() => {
        if (!symbol || assetType !== ASSET_TYPES.MUTUAL_FUND) return


        const controller = new AbortController()

        const getMutualFundsKeyMetrics = async () => {
            try {
                setIsLoading(true)
                setError("")
                // const response = await fetch(`${apiBaseUrl}/metrics/${symbol}`,
                //     { signal: controller.signal }
                // )
                const response = await Promise.all([
                    fetch(`${apiBaseUrl}/mutual-fund/holdings/${symbol}`, { signal: controller.signal }),
                    fetch(`${apiBaseUrl}/mutual-fund/expense-ratio/${symbol}`, { signal: controller.signal })
                ])
                const [holdings, expenseRatio] = response
                console.log(response)
                console.log(holdings)
                if (!holdings.ok) {
                    throw new Error(`Metrics request failed with status ${holdings.status}`
                    )
                }
                if (!expenseRatio.ok) {
                    throw new Error(`Metrics request failed with status ${expenseRatio.status}`
                    )
                }
                const holdingAmount = await holdings.json()
                const expenseRatioRate = await expenseRatio.json()
                console.log(holdingAmount)
                setMutualFundHoldings(holdingAmount)
                setMutualFundExpenseRatio(expenseRatioRate)
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
        getMutualFundsKeyMetrics()

        return () => {
            controller.abort()
        }
    }, [symbol, assetType])

    console.log(mutualFundHoldings)

    console.log(mutualFundExpenseRatio)


    const metrics = companyKeyMetrics ?? {}
    // Fund-specific fields comes from the profile request owned by App; price fields
    // such as beta and 52-week range still come from this component's metrics request.
    const fundMetrics = etfProfile ?? {}

    const mutualFundHoldingsAndNetAssets = mutualFundHoldings ?? {}

    const mutualFundExpenseRatios = mutualFundExpenseRatio ?? {}

    const { metadata } = mutualFundHoldingsAndNetAssets ?? {}

    const { assets, fees, risk_ratios } = mutualFundExpenseRatios?.summary ?? {}

    console.log(mutualFundExpenseRatio)
    console.log(mutualFundHoldingsAndNetAssets)


    const { ['52WeekHigh']: week52High, ['52WeekLow']: week52Low, marketCapitalization, peTTM, forwardPE, epsTTM, currentDividendYieldTTM, beta } = metrics ?? {}
    const { dividend_yield, net_assets, net_expense_ratio, holdings, portfolio_turnover } = fundMetrics ?? {}

    // The ETF provider serializes net assets as a numeric string.
    const convertNetAssetToNumber = net_assets !== undefined && net_assets !== null && assetType === "ETP" ? Number(net_assets) : assetType === "Mutual Fund" ? Number(assets?.net_assets_usd) : "N/A"

    // Keeping display metadata together lets stocks and funds share one render shape.
    const keyMetricsData = [
        { label: "Market Cap: ", value: formatMarketCap(marketCapitalization, currency), prefix: getSymbol("$", marketCapitalization) },
        { label: "P/E Ratio: ", value: formatMetrics(peTTM) },
        { label: "Forward P/E: ", value: formatMetrics(forwardPE) },
        { label: "Dividend Yield: ", value: `${formatMetrics(currentDividendYieldTTM)}`, suffix: getSymbol("%", currentDividendYieldTTM) },
        { label: "Beta: ", value: formatMetrics(beta) },
        { label: "Earnings Per Share: ", value: epsTTM ? epsTTM?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "N/A", prefix: getSymbol("$", epsTTM) },
        {
            label: "52 Week High: ", value: formatLargePriceValue(week52High)
        },
        { label: "52 Week Low: ", value: formatLargePriceValue(week52Low) },
    ]

    const keyMutualFundMetrics = [
        // { label: "Dividend Yield: ", value: `${formatMetrics(convertDecimalToPercentage(dividend_yield))}`, suffix: getSymbol("%", dividend_yield) },
        { label: "Beta: ", value: formatMetrics(risk_ratios?.beta_5y) },
        { label: "Net Assets: ", value: formatNetAssets(convertNetAssetToNumber), prefix: getSymbol("$", convertNetAssetToNumber) },
        { label: "Expense Ratio: ", value: `${fees?.net_expense_ratio_pct}`, suffix: getSymbol("%", fees?.net_expense_ratio_pct) },
        // { label: "52 Week High: ", value: formatMetrics(week52High), prefix: getSymbol("$", week52High) },
        // { label: "52 Week Low: ", value: formatMetrics(week52Low), prefix: getSymbol("$", week52Low) },
        { label: "Holdings: ", value: metadata?.holdings_count ? metadata.holdings_count.toLocaleString("en-US") : "N/A" },
        { label: "Portfolio Turnover: ", value: `${formatMetrics(fees?.portfolio_turnover_pct)}`, suffix: getSymbol("%", fees?.portfolio_turnover_pct) }
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

    const metricsToDisplay = isStock ? keyMetricsData : assetType === "ETP" ? keyFundMetrics : keyMutualFundMetrics

    return (
        <div className='card metrics-card'>
            <h2>Key Metrics</h2>
            {isLoading && <Loading />}
            {!symbol && assetType === ASSET_TYPES.COMMON_STOCK && <h4>{"Search for a stock or ETF to view key metrics."}</h4>}
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
