import './WatchList.css'
import { formatStockName } from '../../helperFunctions/formatStockName'

const WatchList = ({ fundWatchList }) => {

    return (
        <div className='card watch-list'>
            <h2>Watch List</h2>
            {fundWatchList.length > 5 ? <h2>{"Max Watchlist length hit"}</h2> : (
                fundWatchList?.map((item) => {
                    const { symbol, fund } = item
                    return (
                        <div className='fund-card' key={symbol} onClick={() => selectStock(item)}>
                            <p className='fund-name'>{formatStockName(fund)}</p>
                            <p className='fund-symbol'>{symbol}</p>
                        </div>
                    )
                })
            )}
        </div>
    )
}

export default WatchList