import React from 'react'
import './WatchList.css'

const WatchList = ({ fundWatchList }) => {

    return (
        <div className='card watch-list'>
            <h2>Watch List</h2>
            {fundWatchList.length > 5 ? <h2>{"Max Watchlist length hit"}</h2> : (
                fundWatchList?.map((item) => {
                    const { symbol, fund } = item
                    return (
                        <div key={fund} style={{ marginBottom: '15px' }}>
                            <p>Symbol: {symbol}</p>
                            <p>Fund: {fund}</p>
                        </div>
                    )
                })
            )}
        </div>
    )
}

export default WatchList