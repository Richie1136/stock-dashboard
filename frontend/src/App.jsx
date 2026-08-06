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

function App() {

  const [symbol, setSymbol] = useState("")
  const [assetType, setAssetType] = useState("Common Stock")
  const [fundName, setFundName] = useState("")
  const [etfProfile, setEtfProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [finishedEtfSymbol, setFinishedEtfSymbol] = useState("")
  const [error, setError] = useState("")
  const [fundWatchList, setFundWatchList] = useState([])


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
        const fundResponse = await fetch(`http://localhost:5001/api/etf/${symbol}`,
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

  const updateFundWatchList = () => {
    if (!symbol || fundWatchList.some((fund) => fund.symbol === symbol)) return

    setFundWatchList([...Object.values(fundWatchList), { "symbol": symbol, "fund": formatFundName(fundName) }])
  }

  return (
    <section className="app">
      <Header setSymbol={setSymbol} setAssetType={setAssetType} setFundName={setFundName} />
      <div className='dashboard'>
        <WatchList symbol={symbol} fundName={fundName} fundWatchList={fundWatchList} />
        <main className='dashboard-main'>
          <CompanyCard updateWatchList={updateFundWatchList} symbol={symbol} assetType={assetType} fundName={fundName} etfProfile={etfProfile} />
          <KeyMetrics symbol={symbol} assetType={assetType} etfProfile={etfProfile} />
          <PriceChart symbol={symbol} assetType={assetType} finishedEtfSymbol={finishedEtfSymbol} />
          <NewsCard symbol={symbol} />
          <AISummaryCard />
        </main>
      </div>
    </section>
  )
}

export default App
