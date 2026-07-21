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

  return (
    <>
      <section className="app">
        <Header setSymbol={setSymbol} />
        <div className='dashboard'>
          <Sidebar />
          <main className='dashboard-main'>
            <CompanyCard symbol={symbol} />
            <KeyMetrics symbol={symbol} />
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
