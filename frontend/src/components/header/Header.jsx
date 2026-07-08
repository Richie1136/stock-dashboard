import { useState, useEffect, useRef } from "react"
import './Header.css'

const Header = ({ setSymbol }) => {

    const [searchStock, setSearchStock] = useState("")
    const [suggestions, setSuggestions] = useState([])
    const inputClickAway = useRef(null)

    const handleSearch = () => {
        if (!searchStock?.trim()) return
        setSymbol(searchStock?.trim().toUpperCase())
        setSearchStock("")
        setSuggestions([])
    }

    const handleClear = (e) => {
        e.stopPropagation()
        setSearchStock("")
        setSuggestions([])
    }

    const handleSugguestionClick = (symbol) => {
        setSymbol(symbol)
        setSearchStock("")
        setSuggestions([])
    }

    useEffect(() => { // Close the suggestions dropdown when the user clicks outside the search container.
        const handleInputClickAway = (e) => {
            if (!inputClickAway.current) return;

            if (!inputClickAway.current.contains(e.target)) {
                setSuggestions([])
            }
        }
        document.addEventListener('click', handleInputClickAway)
        return () => document.removeEventListener('click', handleInputClickAway)
    }, [])

    useEffect(() => {
        if (!searchStock.trim) {
            setSuggestions([])
            return
        }
        const getTypedStock = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/search?query=${searchStock}`)
                const data = await response.json()
                const useOnlyStock = data?.result?.filter((stock) => {
                    return stock.type === "Common Stock" && !stock.displaySymbol.includes(".")
                })
                setSuggestions(useOnlyStock)
            } catch (error) {
                console.error("Error fetching company data:", error)
            }
        }
        getTypedStock()
    }, [searchStock])

    return (
        <div className="header">
            <h1>Stock Dashboard</h1>
            <div className='search-bar-container'>
                <div className="search-input-container" ref={inputClickAway}>
                    <input value={searchStock} placeholder="Search for Stock" onChange={(e) => setSearchStock(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearch()
                        }}
                    />
                    <button className="clear-button" onClick={handleClear}>x</button>
                </div>
                <button disabled={!searchStock?.trim()} className="search-button" onClick={handleSearch}>Search</button>
                <div className="sugguestions">
                    {suggestions?.map((stock, index) => {
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