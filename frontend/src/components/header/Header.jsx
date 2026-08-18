import { useState, useEffect, useRef } from "react"
import './Header.css'

const Header = ({ selectStock }) => {

    const [searchStock, setSearchStock] = useState("")
    const [suggestions, setSuggestions] = useState([])
    const [searchError, setSearchError] = useState("")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [suggestionsLoading, setSuggestionsLoading] = useState(false)
    const inputClickAway = useRef(null)
    const pendingSearch = useRef(false)

    // Map common former company names to terms supported by the search API.
    const stockAliases = {
        google: "alphabet",
        facebook: "meta"
    }

    const searchSuggestions = (suggestions, resolvedQuery, query, normalizedQuery) => {
        // Prefer an exact ticker match, then fall back to the start of a company name.
        const exactSymbolMatch = suggestions.find((stock) => {
            return stock?.symbol?.toLowerCase() === resolvedQuery
        })

        const companyNameMatch = suggestions.find((stock) => {
            return stock?.description?.trim().toLowerCase().startsWith(normalizedQuery)
        })

        const selectedStock = exactSymbolMatch || companyNameMatch

        if (!selectedStock?.symbol) {
            setSearchError(`No Matching Stock Found for ${query}`)
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
            const response = await fetch(`http://localhost:5001/api/search?query=${encodeURIComponent(query)}`,
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

            const normalizedQuery = query.toLowerCase()
            const resolvedQuery = stockAliases[normalizedQuery] || normalizedQuery

            const stockSuggestions = await getStockSuggestions(resolvedQuery, signal)
            if (!ignore) {
                setSuggestions(stockSuggestions)
                setShowSuggestions(true)
                setSuggestionsLoading(false)

                if (pendingSearch.current) {
                    pendingSearch.current = false
                    searchSuggestions(stockSuggestions, resolvedQuery, query, normalizedQuery)
                }

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


    const handleSearch = () => {
        const query = searchStock.trim()

        if (!query) return

        if (suggestionsLoading) {
            // Submit once the in-flight suggestion request has populated the results.
            pendingSearch.current = true
            return
        }

        try {
            const normalizedQuery = query.toLowerCase()

            const resolvedQuery = stockAliases[normalizedQuery] || normalizedQuery
            // Always fetch results for the exact submitted query.

            if (suggestions.length === 0) {
                setSearchError(`No matching Stock found for ${query} `)
                return
            }
            searchSuggestions(suggestions, resolvedQuery, query, normalizedQuery)
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