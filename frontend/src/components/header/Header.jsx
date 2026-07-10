import { useState, useEffect, useRef } from "react"
import './Header.css'

const Header = ({ setSymbol }) => {

    const [searchStock, setSearchStock] = useState("")
    const [suggestions, setSuggestions] = useState([])
    const inputClickAway = useRef(null)

    const handleSearch = () => {
        console.log("Handle search")
        if (!searchStock?.trim()) return
        setSymbol(searchStock?.trim())
        setSearchStock("")
        setSuggestions([])
    }

    const handleClear = (e) => {
        e.stopPropagation()
        setSearchStock("")
        setSuggestions([])
    }

    const handleSuggestionClick = (symbol) => {
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
        let ignore = false
        if (!searchStock.trim()) {
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
                console.log("About to set suggestions. Current searchStock:", searchStock)
                console.log(searchStock)
                console.log(useOnlyStock)
                if (!ignore) {
                    setSuggestions(useOnlyStock)
                }
            } catch (error) {
                console.error("Error fetching company data:", error)
            }
        }
        getTypedStock()
        return () => {
            ignore = true
        }
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
                                onClick={() => handleSuggestionClick(symbol)}
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