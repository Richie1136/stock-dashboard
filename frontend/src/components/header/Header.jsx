import { useState } from "react"
import './Header.css'

const Header = ({ setSymbol }) => {

    const [searchStock, setSearchStock] = useState("")

    const handleSearch = () => {
        if (!searchStock.trim()) return
        setSymbol(searchStock.trim().toUpperCase())
        setSearchStock("")
    }

    console.log(searchStock)

    return (
        <div className="header">
            <h1>Stock Dashboard</h1>
            <div className='search-bar-container'>
                <input value={searchStock} placeholder="Search for Stock" onChange={(e) => setSearchStock(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch()
                    }} />
                {searchStock && <button className="clear-search" onClick={handleSearch}>Search</button>}
            </div>
        </div>
    )
}

export default Header