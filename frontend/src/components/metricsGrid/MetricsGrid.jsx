import { useState, useEffect } from 'react'
import './MetricsGrid.css'

const MetricsGrid = ({ symbol }) => {

    const [companyKeyMetrics, setCompanyKeyMetrics] = useState({})

    useEffect(() => {
        if (!symbol) return
        try {
            const getCompanyKeyMetrics = async () => {
                const response = await fetch(`http://localhost:5001/api/metrics/${symbol}`)
                const data = await response.json()
                console.log(data)
                setCompanyKeyMetrics(data)
            }
            getCompanyKeyMetrics()
        } catch (err) {
            console.log(err)
        }
    }, [symbol])

    console.log(companyKeyMetrics.metric)

    const { ['52WeekHigh']: week52High, } = companyKeyMetrics.metric

    console.log(week52High)

    return (
        <div className='card metrics-grid'>Key Metrics</div>
    )
}

export default MetricsGrid