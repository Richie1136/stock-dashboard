import { useState } from "react"
import './Header.css'

const Header = () => {

    const [searchStock, setSearchStock] = useState("")


    const handleClear = () => {
        setSearchStock("")
    }

    return (
        <div>
            <h1>Stock Dashboard</h1>
            <div className='search-bar-container'>
                <input value={searchStock} placeholder="Search for Stock" onChange={(e) => setSearchStock(e.target.value)} />
                {searchStock && <button className="clear-search" onClick={handleClear}>X</button>}
            </div>
        </div>
    )
}

export default Header