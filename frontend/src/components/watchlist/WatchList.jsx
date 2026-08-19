import './WatchList.css'
import { formatDisplayName } from '../../helperFunctions/formatDisplayName'

const WatchList = ({ fundWatchList, selectStock, symbol, setFundWatchList }) => {

    const removeItemFromList = (e, item) => {
        e.stopPropagation()
        const filteredWatchList = fundWatchList.filter((watchListItem) => watchListItem.symbol !== item.symbol)
        setFundWatchList(filteredWatchList)
    }

    return (
        <div className='card watch-list'>
            <h2>Watch List</h2>
            {fundWatchList.length >= 10 ? <h2>{"Max Watchlist length hit"}</h2> : (
                fundWatchList?.map((item) => {
                    return (
                        <div className={`fund-card ${symbol === item.symbol ? 'active' : ''}`} key={item.symbol} onClick={() => selectStock(item)}>
                            <div className='fund-info'>
                                <p className='fund-name'>{formatDisplayName(item.description, item.type)}</p>
                                <p className='fund-symbol'>{item.symbol}</p>
                            </div>
                            <button className='remove-button' onClick={(e) => removeItemFromList(e, item)}>×</button>
                        </div>
                    )
                })
            )}
        </div>
    )
}

export default WatchList