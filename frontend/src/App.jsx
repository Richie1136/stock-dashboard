import './App.css'
import AISummaryCard from './components/aiSummaryCard/AISummaryCard'
import ChartCard from './components/chartCard/ChartCard'
import CompanyCard from './components/companyCard/CompanyCard'
import Header from './components/header/Header'
import MetricsGrid from './components/metricsGrid/MetricsGrid'
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
            <MetricsGrid symbol={symbol} />
            <ChartCard />
            <NewsCard />
            <AISummaryCard />
          </main>
        </div>
      </section>
    </>
  )
}

export default App
