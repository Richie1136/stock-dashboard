import { useState, useEffect, useRef } from "react"
import './Header.css'

const Header = ({ setSymbol }) => {

    const [searchStock, setSearchStock] = useState("")
    const [suggestions, setSuggestions] = useState([])
    const [searchError, setSearchError] = useState("")
    const inputClickAway = useRef(null)

    const stockAliases = {
        google: "alphabet",
        facebook: "meta"
    }


    const getStockSuggestions = async (query) => {

        try {
            const response = await fetch(`http://localhost:5001/api/search?query=${encodeURIComponent(query)}`)
            if (!response.ok) {
                throw new Error(`Search failed with status ${response.status}`)
            }
            const data = await response.json()

            const useOnlyStock = data?.result?.filter((stock) => {
                return (
                    stock.type === "Common Stock" && !stock.displaySymbol.includes(".")
                )
            }) || []
            return useOnlyStock
        } catch (error) {
            console.error("Error fetching company data:", error)
            return []
        }
    }

    useEffect(() => {
        let ignore = false
        const loadStockSuggestions = async () => {
            const query = searchStock.trim()

            if (!query) {
                setSuggestions([])
                return
            }

            const normalizeQuery = query.toLowerCase()
            const resolvedQuery = stockAliases[normalizeQuery] || normalizeQuery

            const stockSuggestions = await getStockSuggestions(resolvedQuery)

            if (!ignore) {
                setSuggestions(stockSuggestions)

            }
        }
        const timeoutId = setTimeout(() => {
            loadStockSuggestions()

        }, 400)

        return () => {
            ignore = true
            clearTimeout(timeoutId)
        }
    }, [searchStock])


    const handleSearch = async () => {
        const query = searchStock.trim()

        if (!query) return

        try {
            const normalizeQuery = query.toLowerCase()

            const resolvedQuery = stockAliases[normalizeQuery] || normalizeQuery
            // Always fetch results for the exact submitted query.
            const currentSuggestions = await getStockSuggestions(resolvedQuery)


            const exactSymbolMatch = currentSuggestions.find((stock) => {
                return stock?.symbol?.toLowerCase() === normalizeQuery
            })

            const companyNameMatch = currentSuggestions.find((stock) => {
                return stock?.description?.trim().toLowerCase().startsWith(resolvedQuery)
            })

            const selectedStock = exactSymbolMatch || companyNameMatch

            if (!selectedStock?.symbol) {
                console.error("No matching stock found")
                setSearchError(`No Matching Stock Found for ${query}`)

                return
            }

            // Resolve the ticker here, one time

            setSymbol(selectedStock.symbol.toUpperCase())
            setSearchError("")
            setSearchStock("")
            setSuggestions([])
        } catch (err) {
            console.error("Unable to search for stock:", err)
        }
    }

    const handleClear = (e) => {
        e.stopPropagation()
        setSearchStock("")
        setSuggestions([])
        setSearchError("")
    }

    const handleSuggestionClick = (stock) => {
        if (!stock.symbol) return
        setSymbol(stock.symbol.toUpperCase())
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


    const handleInputChange = (e) => {
        setSearchStock(e.target.value)
        setSearchError("")
    }

    return (
        <div className="header">
            <h1>Stock Dashboard</h1>
            <div className='search-bar-container'>
                <div className="search-input-container" ref={inputClickAway}>
                    <input value={searchStock} placeholder="Search for Stock" onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearch()
                        }}
                    />
                    <p>{searchError}</p>
                    <button className="clear-button" onClick={handleClear}>x</button>
                </div>
                <button disabled={!searchStock?.trim()} className="search-button" onClick={handleSearch}>Search</button>
                <div className="suggestions">
                    {suggestions?.map((stock, index) => {
                        const { description, symbol } = stock
                        return (
                            <div className="suggestion-item" style={{ cursor: 'pointer' }} key={`${symbol}-${index}`}
                                onClick={() => handleSuggestionClick(stock)}
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