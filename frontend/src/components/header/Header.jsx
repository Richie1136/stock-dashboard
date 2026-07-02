import { useState, useEffect } from "react"
import './Header.css'

const Header = ({ setSymbol }) => {

    const [searchStock, setSearchStock] = useState("")
    const [sugguestions, setSugguestions] = useState([])

    const handleSearch = () => {
        if (!searchStock?.trim()) return
        setSymbol(searchStock?.trim().toUpperCase())
        setSearchStock("")
    }

    console.log(searchStock)


    useEffect(() => {
        if (!searchStock) return
        try {
            const getTypedStock = async () => {
                const response = await fetch(`http://localhost:5001/api/search?query=${searchStock}`)
                console.log(response)
                const data = await response.json()
                console.log(data)
                setSugguestions(data.result)
            }
            getTypedStock()
        } catch (error) {
            console.log(error)
            console.error("Error fetching company data:", error)
        }
    }, [searchStock])

    console.log(sugguestions)


    return (
        <div className="header">
            <h1>Stock Dashboard</h1>
            <div className='search-bar-container'>
                <input value={searchStock} placeholder="Search for Stock" onChange={(e) => setSearchStock(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch()
                    }} />
                <button disabled={!searchStock?.trim()} className="search-button" onClick={handleSearch}>Search</button>
                <div className="sugguestions">
                    {sugguestions?.map((stock) => {
                        const { description, symbol } = stock
                        return (
                            <div className="suggestion-item" key={symbol}>
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