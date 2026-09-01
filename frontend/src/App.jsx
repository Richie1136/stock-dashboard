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

function App() {

  const [symbol, setSymbol] = useState("")
  const [assetType, setAssetType] = useState("Common Stock")
  const [fundName, setFundName] = useState("")
  const [etfProfile, setEtfProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [finishedEtfSymbol, setFinishedEtfSymbol] = useState("")
  const [error, setError] = useState("")
  const [fundWatchList, setFundWatchList] = useState([])
  const [hasLoadedWatchlist, setHasLoadedWatchlist] = useState(false)

  // ETF profile data must finish loading before dependent cards request their data.
  useEffect(() => {
    if (!symbol || assetType !== "ETP") {
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
        if (!fundResponse.ok) {
          throw new Error(`Fund request failed with status ${fundResponse.status}`)
        }
        const fundData = await fundResponse.json()

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

  return (
    <section className="app">
      <Header selectStock={selectStock} symbol={symbol} />
      <div className='dashboard'>
        <WatchList setFundWatchList={setFundWatchList} symbol={symbol} fundWatchList={fundWatchList} selectStock={selectStock} />
        <main className='dashboard-main'>
          <div className='top-row'>
            <CompanyCard updateWatchList={updateFundWatchList} symbol={symbol} assetType={assetType} fundName={fundName} etfProfile={etfProfile} />
            <KeyMetrics symbol={symbol} assetType={assetType} etfProfile={etfProfile} />
          </div>
          <div className='bottom-row'>
            <PriceChart symbol={symbol} assetType={assetType} finishedEtfSymbol={finishedEtfSymbol} />
            <NewsCard symbol={symbol} />
          </div>
          <AISummaryCard />
        </main>
      </div>
    </section>
  )
}

export default App
