import './App.css'
import AISummaryCard from './components/aiSummaryCard/AISummaryCard'
import PriceChart from './components/priceChart/PriceChart'
import CompanyCard from './components/companyCard/CompanyCard'
import Header from './components/header/Header'
import KeyMetrics from './components/keyMetrics/KeyMetrics'
import NewsCard from './components/newsCard/NewsCard'
import Sidebar from './components/sidebar/Sidebar'
import { useState } from 'react'
function App() {

  const [symbol, setSymbol] = useState("")
  const [assetType, setAssetType] = useState("Common Stock")

  return (
    <>
      <section className="app">
        <Header setSymbol={setSymbol} setAssetType={setAssetType} />
        <div className='dashboard'>
          <Sidebar />
          <main className='dashboard-main'>
            <CompanyCard symbol={symbol} assetType={assetType} />
            <KeyMetrics symbol={symbol} assetType={assetType} />
            <PriceChart symbol={symbol} />
            <NewsCard />
            <AISummaryCard />
          </main>
        </div>
      </section>
    </>
  )
}

export default App
