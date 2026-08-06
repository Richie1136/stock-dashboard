import { useState, useEffect, useRef } from "react"
import './Header.css'

const Header = ({ setSymbol, setAssetType, setFundName }) => {

    const [searchStock, setSearchStock] = useState("")
    const [suggestions, setSuggestions] = useState([])
    const [searchError, setSearchError] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [suggestionsLoading, setSuggestionsLoading] = useState(false)
    const inputClickAway = useRef(null)

    const stockAliases = {
        google: "alphabet",
        facebook: "meta"
    }


    const getStockSuggestions = async (query, signal) => {

        try {
            const response = await fetch(`http://localhost:5001/api/search?query=${encodeURIComponent(query)}`,
                { signal }

            )
            if (!response.ok) {
                throw new Error(`Search failed with status ${response.status}`)
            }
            const data = await response.json()

            const supportedAssets = data?.result?.filter((stock) => {
                return (
                    (stock.type === "Common Stock" || stock.type === 'ETP') && !stock.displaySymbol.includes(".")
                )
            }) || []
            return supportedAssets
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Error fetching company data:", error)
                setSearchStock("")
                setSuggestions([])
            }
            return []
        }
    }

    useEffect(() => {
        let ignore = false
        const controller = new AbortController()
        const signal = controller.signal
        const query = searchStock.trim()

        if (!query) {
            setSuggestionsLoading(false)
            setSuggestions([])
            return
        }

        setSuggestionsLoading(true)

        const loadStockSuggestions = async () => {

            const normalizeQuery = query.toLowerCase()
            const resolvedQuery = stockAliases[normalizeQuery] || normalizeQuery

            const stockSuggestions = await getStockSuggestions(resolvedQuery, signal)
            if (!ignore) {
                setSuggestions(stockSuggestions)
                setShowSuggestions(true)
                setSuggestionsLoading(false)

            }
        }
        const timeoutId = setTimeout(() => {
            loadStockSuggestions()
        }, 400)

        return () => {
            ignore = true
            clearTimeout(timeoutId)
            controller.abort()

        }
    }, [searchStock])


    const handleSearch = async () => {
        const query = searchStock.trim()

        if (!query || suggestionsLoading) return

        try {
            const normalizeQuery = query.toLowerCase()

            const resolvedQuery = stockAliases[normalizeQuery] || normalizeQuery
            // Always fetch results for the exact submitted query.
            // let currentSuggestions = suggestions

            if (suggestions.length === 0) {
                setSearchError(`No matching Stock found for ${query} `)
                // currentSuggestions = await getStockSuggestions(resolvedQuery, signal)
            }

            const exactSymbolMatch = suggestions.find((stock) => {
                return stock?.symbol?.toLowerCase() === resolvedQuery
            })

            const companyNameMatch = suggestions.find((stock) => {
                return stock?.description?.trim().toLowerCase().startsWith(normalizeQuery)
            })

            const selectedStock = exactSymbolMatch || companyNameMatch

            if (!selectedStock?.symbol) {
                setSearchError(`No Matching Stock Found for ${query}`)
                return
            }

            setSymbol(selectedStock.symbol.toUpperCase())
            setAssetType(selectedStock.type)
            setFundName(selectedStock.description)

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
        setAssetType(stock.type)
        setSearchStock("")
        setSuggestions([])
        setFundName(stock.description)
    }

    useEffect(() => { // Close the suggestions dropdown when the user clicks outside the search container.
        const handleInputClickAway = (e) => {
            if (!inputClickAway.current) return;

            if (!inputClickAway.current.contains(e.target)) {
                setShowSuggestions(false)
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
                <button disabled={suggestionsLoading || !searchStock?.trim()} className="search-button" onClick={handleSearch}>Search</button>
                <div className="suggestions">
                    {showSuggestions && suggestions?.map((stock, index) => {
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