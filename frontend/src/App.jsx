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
import { ASSET_TYPES, isFundAssetType, isStockAssetType } from './constants/assetTypes'

function App() {

  const [symbol, setSymbol] = useState("")
  const [assetType, setAssetType] = useState(ASSET_TYPES.COMMON_STOCK)
  const [fundName, setFundName] = useState("")
  const [etfProfile, setEtfProfile] = useState(null)
  const [mutualFundProfile, setMutualFundProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [finishedEtfSymbol, setFinishedEtfSymbol] = useState("")
  const [error, setError] = useState("")
  const [fundWatchList, setFundWatchList] = useState([])
  const [hasLoadedWatchlist, setHasLoadedWatchlist] = useState(false)
  const [company, setCompany] = useState(null)
  const [companyDailyPrice, setCompanyDailyPrice] = useState(null)


  const isStock = isStockAssetType(assetType)
  const isFund = isFundAssetType(assetType)
  console.log(isStock)

  useEffect(() => {
    if (!symbol || !isStock) return


    // Tie the request to this selection so a slower previous response cannot replace it.
    const controller = new AbortController()

    const getCompanyCard = async () => {
      try {
        setIsLoading(true)
        setError("")
        const response = await fetch(`${apiBaseUrl}/company/${symbol}`,
          { signal: controller.signal }

        )
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        const data = await response.json()
        console.log(data)
        setCompany(data)
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error)
          setError("Unable to load company information")
          setCompany(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }
    getCompanyCard()
  }, [symbol, isStock])

  // ETF profile data must finish loading before dependent cards request their data.
  useEffect(() => {
    if (!symbol || assetType !== ASSET_TYPES.ETP) {
      setEtfProfile(null)
      setFinishedEtfSymbol("")
      return
    }

    const controller = new AbortController()
    let delayTimer;

    const fetchEtfProfile = async () => {
      try {
        setEtfProfile(null)
        setIsLoading(true)
        setError("")
        setFinishedEtfSymbol("")
        const fundResponse = await fetch(`${apiBaseUrl}/etf/${symbol}`,
          { signal: controller.signal }
        )
        console.log(fundResponse)

        if (!fundResponse.ok) {
          throw new Error(`Fund request failed with status ${fundResponse.status}`)
        }
        const fundData = await fundResponse.json()
        console.log(fundData)

        setEtfProfile(fundData)
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err)
          setError("Unable to load company metrics")
          setEtfProfile(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
          // Keep the loading state visible briefly so cards do not flash between states.
          delayTimer = setTimeout(() => {
            setFinishedEtfSymbol(symbol)
          }, 1100);
        }
      }
    }
    fetchEtfProfile()

    return () => {
      controller.abort()
      clearTimeout(delayTimer)
    }
  }, [symbol, assetType])


  console.log(etfProfile)

  // Mutual Fund profile data must finish loading before dependent cards request their data.
  useEffect(() => {
    if (!symbol || assetType !== ASSET_TYPES.MUTUAL_FUND) {
      setMutualFundProfile(null)
      setFinishedEtfSymbol("")
      return
    }

    const controller = new AbortController()
    let delayTimer;

    const fetchMutualFundProfile = async () => {
      try {
        setMutualFundProfile(null)
        setIsLoading(true)
        setError("")
        setFinishedEtfSymbol("")
        const fundResponse = await fetch(`${apiBaseUrl}/mutual-fund/${symbol}`,
          { signal: controller.signal }
        )
        console.log(fundResponse)

        if (!fundResponse.ok) {
          throw new Error(`Fund request failed with status ${fundResponse.status}`)
        }
        const fundData = await fundResponse.json()
        console.log(fundData)

        setMutualFundProfile(fundData)
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err)
          setError("Unable to load company metrics")
          setMutualFundProfile(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
          // Keep the loading state visible briefly so cards do not flash between states.
          delayTimer = setTimeout(() => {
            setFinishedEtfSymbol(symbol)
          }, 1100);
        }
      }
    }
    fetchMutualFundProfile()

    return () => {
      controller.abort()
      clearTimeout(delayTimer)
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
    if (storedValue !== null) {
      setFundWatchList(storedValue)
    }
    setHasLoadedWatchlist(true)
  }, [])

  console.log(mutualFundProfile)

  const updateFundWatchList = () => {
    // Prevent empty and duplicate entries from being added to the watchlist.
    if (!symbol || fundWatchList.some((fund) => fund.symbol === symbol)) return

    setFundWatchList([...Object.values(fundWatchList), { "symbol": symbol, "type": assetType, "description": formatFundName(fundName) }])
  }

  const selectStock = (selectedStock) => {
    setSymbol(selectedStock.symbol.toUpperCase())
    setAssetType(selectedStock.type)
    setFundName(selectedStock.description)
  }

  const isReady = Boolean(symbol) && (assetType !== ASSET_TYPES.ETP || finishedEtfSymbol === symbol);

  useEffect(() => {

    if (!isReady) return

    const controller = new AbortController()

    console.log("PRICE EFFECT RUNNING:", {
      symbol,
      assetType,
      finishedEtfSymbol,
      time: performance.now()
    })

    const fetchPriceCard = async () => {
      try {
        setError("")
        setIsLoading(true)
        const response = await fetch(`${apiBaseUrl}/price-history/${symbol}`, {
          signal: controller.signal
        })
        console.log("Price history status:", response.status);

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
        console.log(data)
        setCompanyDailyPrice(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setCompanyDailyPrice(null)
          setError("Unable to load chart")
          console.error(err)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }
    fetchPriceCard()

    return () => {
      controller.abort()
    }

  }, [symbol, assetType, isReady])

  console.log(company)
  console.log(mutualFundProfile)

  return (
    <section className="app">
      <Header selectStock={selectStock} symbol={symbol} />
      <div className='dashboard'>
        <WatchList setFundWatchList={setFundWatchList} symbol={symbol} fundWatchList={fundWatchList} selectStock={selectStock} />
        <main className='dashboard-main'>
          <div className='top-row'>
            <CompanyCard company={company} isLoading={isLoading} error={error} updateWatchList={updateFundWatchList} symbol={symbol} assetType={assetType} fundName={fundName} etfProfile={etfProfile} mutualFundProfile={mutualFundProfile} />
            <KeyMetrics currency={company?.currency} symbol={symbol} assetType={assetType} etfProfile={etfProfile} />
          </div>
          <div className='bottom-row'>
            <PriceChart setCompanyDailyPrice={setCompanyDailyPrice} companyDailyPrice={companyDailyPrice} symbol={symbol} assetType={assetType} finishedEtfSymbol={finishedEtfSymbol} />
            <NewsCard symbol={symbol} />
          </div>
          <AISummaryCard />
        </main>
      </div>
    </section>
  )
}

export default App
