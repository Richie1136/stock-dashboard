import { useState, useEffect, useRef } from "react"
import './Header.css'
import { apiBaseUrl } from "../../utils/apiConfig"

const Header = ({ selectStock, symbol }) => {

    const [searchStock, setSearchStock] = useState("")
    const [suggestions, setSuggestions] = useState([])
    const [searchError, setSearchError] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [suggestionsLoading, setSuggestionsLoading] = useState(false)
    const inputClickAway = useRef(null)

    const searchControllerRef = useRef(null)

    // Map common former company names to terms supported by the search API.
    const stockAliases = {
        google: "alphabet",
        facebook: "meta"
    }

    const searchSuggestions = (suggestions, resolvedQuery, query, normalizedQuery, queryResult) => {

        // Prefer an exact ticker match, then fall back to the start of a company name.
        const exactSymbolMatch = suggestions.find((stock) => {
            return stock?.symbol?.toLowerCase() === resolvedQuery
        })

        const companyNameMatch = suggestions.find((stock) => {
            return stock?.description?.trim().toLowerCase().startsWith(normalizedQuery)
        })

        const selectedStock = exactSymbolMatch || companyNameMatch

        if (!selectedStock?.symbol) {
            setSearchError(`No results found for "${queryResult}"`)
            return
        }
        selectStock(selectedStock)
        setSearchError("")
        setSearchStock("")
        setSuggestions([])
        setShowSuggestions(false)
    }


    const getStockSuggestions = async (query, signal) => {

        try {
            const response = await fetch(`${apiBaseUrl}/search?query=${encodeURIComponent(query)}`,
                { signal }

            )
            if (!response.ok) {
                throw new Error(`Search failed with status ${response.status}`)
            }
            const data = await response.json()

            // The dashboard currently supports US-listed stocks and ETPs only.
            const supportedAssets = data?.result?.filter((stock) => {
                return (
                    (stock.type === "Common Stock" || stock.type === 'ETP') && (!stock.displaySymbol.includes(".") || stock.displaySymbol === "BRK.A")
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
        searchControllerRef.current = new AbortController()
        const controller = searchControllerRef.current
        const signal = controller.signal
        const query = searchStock.trim()

        if (!query) {
            setSuggestionsLoading(false)
            setSuggestions([])
            return
        }

        setSuggestionsLoading(true)

        const loadStockSuggestions = async () => {

            const normalizedQuery = query.toLowerCase()
            const resolvedQuery = stockAliases[normalizedQuery] || normalizedQuery

            const stockSuggestions = await getStockSuggestions(resolvedQuery, signal)
            if (!ignore) {
                setSuggestions(stockSuggestions)
                setShowSuggestions(true)
                setSuggestionsLoading(false)
            }
        }
        // Debounce requests so typing does not trigger a search on every keystroke.
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

        if (!query) return

        const normalizedQuery = query.toLowerCase()

        const resolvedQuery = stockAliases[normalizedQuery] || normalizedQuery

        const queryResult = query.length > 18
            ? `${query.slice(0, 18)}...`
            : query

        if (searchControllerRef.current) {
            searchControllerRef.current.abort()
        }

        searchControllerRef.current = new AbortController()
        if (suggestionsLoading) {
            const controller = searchControllerRef.current
            const signal = controller.signal
            const result = await getStockSuggestions(resolvedQuery, signal)
            searchSuggestions(result, resolvedQuery, query, normalizedQuery, queryResult)
            return
        }

        try {
            if (suggestions.length === 0) {
                setSearchError(`No results found for "${queryResult}"`)
                return
            }
            searchSuggestions(suggestions, resolvedQuery, query, normalizedQuery, queryResult)
        } catch (err) {
            console.error("Unable to search for stock:", err)
        }
    }

    const handleClear = (e) => {
        e.stopPropagation()
        setSearchStock("")
        setSuggestions([])
        setSearchError("")
        setShowSuggestions(false)
    }

    const handleSuggestionClick = (stock) => {
        if (!stock.symbol) return
        selectStock(stock)
        setSearchStock("")
        setSuggestions([])
        setSearchError("")
        setShowSuggestions(false)
    }

    // Close the suggestions dropdown when the user clicks outside the search container.
    useEffect(() => {
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

    // Remove old stale search
    // When i enter a symbol that finds no results and click on the watchlist items
    // The error message should no longer appear

    useEffect(() => {
        if (!symbol) return
        setSearchStock("")
        setSearchError("")
        setSuggestions([])
        setShowSuggestions(false)
    }, [symbol])


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
                    {searchError && <p style={{ marginTop: '5px', color: 'red' }}>
                        {searchError}
                    </p>}
                    <button className="clear-button" onClick={handleClear}>x</button>
                    <div className="suggestions">
                        {showSuggestions && suggestions?.map((stock, index) => {
                            const { description, symbol } = stock
                            return (
                                <div className="suggestion-item" key={`${symbol}-${index}`}
                                    onClick={() => handleSuggestionClick(stock)}
                                >
                                    <span className="suggestion-name">
                                        {description}
                                    </span>
                                    <span className="suggestion-symbol">
                                        ({symbol})
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <button disabled={suggestionsLoading || !searchStock?.trim()} className="search-button" onClick={handleSearch}>Search</button>
            </div>
        </div>
    )
}

export default Header