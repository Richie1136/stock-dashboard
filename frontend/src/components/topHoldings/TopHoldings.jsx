import './TopHoldings.css'

const TopHoldings = ({ mutualFundHoldings }) => {

    const topTenHoldings = mutualFundHoldings?.['data']?.slice(0, 10) ?? []

    const topTenPercentage = topTenHoldings.reduce((total, item) => total + item.weight_pct, 0)

    return (
        <div className='card top-holdings-card'>
            <h2>Top Holdings</h2>
            <span className='total-portfolio-percentage'>{topTenPercentage.toFixed(2)}% of Total Portfolio</span>

            <div className='top-holdings-list'>
                {topTenHoldings.map((item, index) => {

                    const rank = index + 1
                    return (
                        <div className='top-holding-row' key={`${item.issuer_ticker}-${index}`}>
                            <span className='holding-rank'>{rank}.</span>
                            <div className='holding-info'>
                                <span className='holding-ticker'>
                                    {item.issuer_ticker}
                                </span>
                                <span className='holding-name'>
                                    {item.issuer_name}
                                </span>
                            </div>
                            <span className='holding-weight'>
                                {item.weight_pct.toFixed(2)}%
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default TopHoldings