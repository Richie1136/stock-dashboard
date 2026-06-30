import './App.css'
import AISummaryCard from './components/aiSummaryCard/AISummaryCard'
import ChartCard from './components/chartCard/ChartCard'
import CompanyCard from './components/companyCard/CompanyCard'
import Header from './components/header/Header'
import MetricsGrid from './components/metricsGrid/MetricsGrid'
import NewsCard from './components/newsCard/NewsCard'
import Sidebar from './components/sidebar/Sidebar'
function App() {

  return (
    <>
      <section id="center">
        <div>
          <Header />
        </div>
        <div className='dashboard'>
          <Sidebar />
          <main>
            <CompanyCard />
            <MetricsGrid />
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
