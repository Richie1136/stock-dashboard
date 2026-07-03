import { useState, useEffect } from "react"
import './Header.css'

const Header = ({ setSymbol }) => {

    const [searchStock, setSearchStock] = useState("")
    const [sugguestions, setSugguestions] = useState([])

    const handleSearch = () => {
        if (!searchStock?.trim()) return
        setSymbol(searchStock?.trim().toUpperCase())
        setSearchStock("")
        setSugguestions([])
    }

    const handleClear = (e) => {
        e.stopPropagation()
        setSearchStock("")
        setSugguestions([])
    }
    console.log(searchStock)

    const handleSugguestionClick = (symbol) => {
        setSymbol(symbol)
        setSearchStock("")
        setSugguestions([])
    }


    useEffect(() => {
        if (!searchStock.trim) {
            setSugguestions([])
            return
        }
        const getTypedStock = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/search?query=${searchStock}`)
                const data = await response.json()
                const useOnlyStock = data?.result?.filter((stock) => {
                    return stock.type === "Common Stock" && !stock.displaySymbol.includes(".")
                })
                setSugguestions(useOnlyStock)
            } catch (error) {
                console.log(error)
                console.error("Error fetching company data:", error)
            }
        }
        getTypedStock()
    }, [searchStock])

    return (
        <div className="header">
            <h1>Stock Dashboard</h1>
            <div className='search-bar-container'>
                <div className="search-input-container">
                    <input value={searchStock} placeholder="Search for Stock" onChange={(e) => setSearchStock(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearch()
                        }}
                    />
                    <button className="clear-button" onClick={handleClear}>x</button>
                </div>
                <button disabled={!searchStock?.trim()} className="search-button" onClick={handleSearch}>Search</button>
                <div className="sugguestions">
                    {sugguestions?.map((stock, index) => {
                        const { description, symbol } = stock
                        return (
                            <div className="suggestion-item" style={{ cursor: 'pointer' }} key={`${symbol}-${index}`}
                                onClick={() => handleSugguestionClick(symbol)}
                            >
                                {description} ({symbol})
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default Header