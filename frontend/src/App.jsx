import './App.css'
import AISummaryCard from './components/aiSummaryCard/AISummaryCard'
import PriceChart from './components/priceChart/PriceChart'
import CompanyCard from './components/companyCard/CompanyCard'
import Header from './components/header/Header'
import KeyMetrics from './components/keyMetrics/KeyMetrics'
import NewsCard from './components/newsCard/NewsCard'
import { useState, useEffect } from 'react'
import WatchList from './components/watchlist/WatchList'
import { formatFundName } from './helperFunctions/formatFundName'
import { apiBaseUrl } from './utils/apiConfig'
import { ASSET_TYPES, isStockAssetType } from './constants/assetTypes'
import TopHoldings from './components/topHoldings/TopHoldings'
import Loading from './components/loading/Loading'

function App() {

  const [symbol, setSymbol] = useState("")
  const [assetType, setAssetType] = useState(ASSET_TYPES.COMMON_STOCK)
  const [fundName, setFundName] = useState("")
  const [etfProfile, setEtfProfile] = useState(null)
  const [mutualFundProfile, setMutualFundProfile] = useState(null)
  const [fundHoldings, setFundHoldings] = useState(null)
  const [fundHoldingsError, setFundHoldingsError] = useState("")
  const [fundHoldingsLoading, setFundHoldingsLoading] = useState(false)
  const [companyLoading, setCompanyLoading] = useState(false)
  const [companyError, setCompanyError] = useState("")

  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState("")

  const [finishedPriceChartSymbol, setFinishedPriceChartSymbol] = useState("")
  const [finishedKeyMetricsSymbol, setFinishedKeyMetricsSymbol] = useState("")
  const [finishedKeyMetricsDividend, setFinishedKeyMetricsDividend] = useState("")
  const [finishedMutualFundExpenseRatioSymbol, setFinishedMutualFundExpenseRatioSymbol] = useState(false)
  const [finishedOverviewSymbol, setFinishedOverviewSymbol] = useState("")
  const [finishedNewsSymbol, setFinishedNewsSymbol] = useState("")

  const [finishedFundHoldingsSymbol, setFinishedFundHoldingsSymbol] = useState("")

  const [mutualFundLoading, setMutualFundLoading] = useState(false)
  const [mutualFundError, setMutualFundError] = useState("")

  const [etfLoading, setEtfLoading] = useState(false)
  const [etfError, setEtfError] = useState("")
  const [fundWatchList, setFundWatchList] = useState([])
  const [hasLoadedWatchlist, setHasLoadedWatchlist] = useState(false)
  const [company, setCompany] = useState(null)
  const [companyDailyPrice, setCompanyDailyPrice] = useState(null)


  const isStock = isStockAssetType(assetType)

  const isItemInWatchlist = fundWatchList.some((item) => item.symbol === symbol)

  useEffect(() => {
    if (!symbol || !isStock) return


    // Tie the request to this selection so a slower previous response cannot replace it.
    const controller = new AbortController()

    const getCompanyCard = async () => {
      try {
        setCompanyLoading(true)
        setCompanyError("")
        const companyCardResponse = await fetch(`${apiBaseUrl}/company/${symbol}`,
          { signal: controller.signal }

        )
        if (!companyCardResponse.ok) {
          throw new Error(`Request failed with status ${companyCardResponse.status}`)
        }
        const companyCarddata = await companyCardResponse.json()
        setCompany(companyCarddata)
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error)
          setCompanyError("Unable to load company information")
        }
      } finally {
        if (!controller.signal.aborted) {
          setCompanyLoading(false)
          setFinishedOverviewSymbol(symbol)
        }
      }
    }
    getCompanyCard()
  }, [symbol, isStock])

  // ETF profile data must finish loading before dependent cards request their data.
  useEffect(() => {
    if (!symbol || assetType !== ASSET_TYPES.ETP) {
      setEtfProfile(null)
      return
    }

    const controller = new AbortController()

    const fetchEtfProfile = async () => {
      try {
        setEtfProfile(null)
        setEtfLoading(true)
        setEtfError("")
        const fundFetchEtfResponse = await fetch(`${apiBaseUrl}/etf/${symbol}`,
          { signal: controller.signal }
        )
        if (!fundFetchEtfResponse.ok) {
          throw new Error(`Fund request failed with status ${fundFetchEtfResponse.status}`)
        }
        const fundEtfProfileData = await fundFetchEtfResponse.json()

        setEtfProfile(fundEtfProfileData)
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err)
          setEtfError("Unable to load company metrics")
          setEtfProfile(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setEtfLoading(false)
          setFinishedOverviewSymbol(symbol)
        }
      }
    }
    fetchEtfProfile()

    return () => {
      controller.abort()
    }
  }, [symbol, assetType])

  // Mutual Fund profile data must finish loading before dependent cards request their data.
  useEffect(() => {
    if (!symbol || assetType !== ASSET_TYPES.MUTUAL_FUND) {
      setMutualFundProfile(null)
      return
    }

    const controller = new AbortController()

    const fetchMutualFundProfile = async () => {
      try {
        setMutualFundProfile(null)
        setMutualFundLoading(true)
        setMutualFundError("")
        const mutualFundProfileResponse = await fetch(`${apiBaseUrl}/mutual-fund/${symbol}`,
          { signal: controller.signal }
        )

        if (!mutualFundProfileResponse.ok) {
          throw new Error(`Fund request failed with status ${mutualFundProfileResponse.status}`)
        }
        const mutualFundProfileData = await mutualFundProfileResponse.json()

        setMutualFundProfile(mutualFundProfileData)
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err)
          setMutualFundError("Unable to load company metrics")
          setMutualFundProfile(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setMutualFundLoading(false)
          setFinishedOverviewSymbol(symbol)
        }
      }
    }
    fetchMutualFundProfile()

    return () => {
      controller.abort()
    }
  }, [symbol, assetType])


  useEffect(() => {
    // Do not overwrite a saved list with the initial empty state before hydration finishes.
    if (hasLoadedWatchlist) {
      localStorage.setItem("WatchList", JSON.stringify(fundWatchList))
    }
  }, [fundWatchList, hasLoadedWatchlist])

  useEffect(() => {
    // Hydrate once on startup; subsequent watchlist changes are persisted above.
    const storedValue = JSON.parse(localStorage.getItem("WatchList"))
    const storedFund = JSON.parse(localStorage.getItem("fundData"))
    if (storedValue !== null) {
      setFundWatchList(storedValue)
    }
    if (storedFund !== null) {
      selectStock(storedFund)
    }
    setHasLoadedWatchlist(true)
  }, [])

  const updateFundWatchList = () => {
    // Prevent empty and duplicate entries from being added to the watchlist.
    if (!symbol) return

    if (isItemInWatchlist) {
      const updatedWatchlist = fundWatchList?.filter((item) => item.symbol !== symbol)
      setFundWatchList(updatedWatchlist)
      return

    }

    setFundWatchList([...Object.values(fundWatchList), { "symbol": symbol, "type": assetType, "description": formatFundName(fundName) }])
  }

  const selectStock = (selectedStock) => {
    setSymbol(selectedStock.symbol.toUpperCase())
    setAssetType(selectedStock.type)
    setFundName(selectedStock.description)
    localStorage.setItem("fundData", JSON.stringify(selectedStock))
  }


  const isReady = Boolean(symbol);

  useEffect(() => {

    if (!isReady) return

    const controller = new AbortController()

    const fetchPriceCard = async () => {
      try {
        setPriceError("")
        setPriceLoading(true)
        const response = await fetch(`${apiBaseUrl}/price-history/${symbol}`, {
          signal: controller.signal
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.log("Price History failed", {
            symbol,
            status: response.status,
            errorData
          });
          throw new Error(`Request failed with status ${response.status}`)
        }
        const data = await response.json()
        setCompanyDailyPrice(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setCompanyDailyPrice(null)
          setPriceError("Unable to load chart")
          console.error(err)
        }
      } finally {
        if (!controller.signal.aborted) {
          setPriceLoading(false)
          setFinishedPriceChartSymbol(symbol)
        }
      }
    }
    fetchPriceCard()

    return () => {
      controller.abort()
    }

  }, [symbol, assetType, isReady])

  useEffect(() => {
    if (!symbol || isStock) return
    const controller = new AbortController()

    const getFundHoldings = async () => {
      try {
        setFundHoldingsError("")
        setFundHoldingsLoading(true)
        const response = await fetch(`${apiBaseUrl}/fund/holdings/${symbol}`, { signal: controller.signal })
        const data = await response.json()
        setFundHoldings(data)
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err)
          setFundHoldingsError("Unable to load Fund holdings")
          setFundHoldings(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setFinishedFundHoldingsSymbol(symbol)
          setFundHoldingsLoading(false)
        }
      }
    }
    getFundHoldings()
    return () => {
      controller.abort()
    }
  }, [symbol, assetType])

  const companyLoader = isStock ? companyLoading : assetType === ASSET_TYPES.MUTUAL_FUND ? mutualFundLoading : etfLoading
  const errorLoader = isStock ? companyError : assetType === ASSET_TYPES.MUTUAL_FUND ? mutualFundError : etfError

  const fundReady = finishedFundHoldingsSymbol === symbol &&
    finishedOverviewSymbol === symbol &&
    finishedPriceChartSymbol === symbol

  const dashboardReady = assetType === ASSET_TYPES.MUTUAL_FUND ? fundReady && finishedMutualFundExpenseRatioSymbol === symbol : assetType === ASSET_TYPES.ETP ? fundReady && finishedKeyMetricsDividend === symbol && finishedKeyMetricsSymbol === symbol : finishedKeyMetricsSymbol === symbol && finishedOverviewSymbol === symbol && finishedPriceChartSymbol === symbol && finishedNewsSymbol === symbol

  const dashboardLoading = Boolean(symbol) && !dashboardReady

  const assetTypeHoldings = assetType === ASSET_TYPES.MUTUAL_FUND ? fundHoldings : etfProfile

  const totalAmountOfHoldings = fundHoldings?.metadata?.holdings_count

  console.log({
    symbol,
    finishedOverviewSymbol,
    finishedKeyMetricsSymbol,
    finishedPriceChartSymbol,
    finishedNewsSymbol,
    dashboardReady
  })

  return (
    <section className="app">
      <Header selectStock={selectStock} symbol={symbol} />
      <div className='dashboard'>
        <WatchList setFundWatchList={setFundWatchList} symbol={symbol} fundWatchList={fundWatchList} selectStock={selectStock} />
        <div className='dashboard-content'>
          {dashboardLoading && (
            <div className='dashboard-loader'>
              <Loading />
            </div>
          )}
          <main className={`dashboard-main ${dashboardLoading ? "dashboard-main-hidden" : ""}`}>
            <div className='top-row'>
              <CompanyCard isItemInWatchlist={isItemInWatchlist} company={company} isLoading={companyLoader} error={errorLoader} updateWatchList={updateFundWatchList} symbol={symbol} assetType={assetType} fundName={fundName} etfProfile={etfProfile} mutualFundProfile={mutualFundProfile} />
              <KeyMetrics setFinishedKeyMetricsDividend={setFinishedKeyMetricsDividend} setFinishedMutualFundExpenseRatioSymbol={setFinishedMutualFundExpenseRatioSymbol} setFinishedKeyMetricsSymbol={setFinishedKeyMetricsSymbol} totalAmountOfHoldings={totalAmountOfHoldings} currency={company?.currency} symbol={symbol} assetType={assetType} etfProfile={etfProfile} />
            </div>
            <div className='bottom-row'>
              <PriceChart isLoading={priceLoading} error={priceError} setCompanyDailyPrice={setCompanyDailyPrice} companyDailyPrice={companyDailyPrice} symbol={symbol} assetType={assetType} />
              {assetType === ASSET_TYPES.MUTUAL_FUND || assetType === ASSET_TYPES.ETP ? <TopHoldings symbol={symbol} holdings={assetTypeHoldings} assetType={assetType} totalAmountOfHoldings={totalAmountOfHoldings} /> : <NewsCard symbol={symbol} setFinishedNewsSymbol={setFinishedNewsSymbol} />}
            </div>
            <AISummaryCard />
          </main>
        </div>
      </div>
    </section>
  )
}

export default App
