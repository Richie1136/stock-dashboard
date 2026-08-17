import './customTooltip.css'

export const CustomTooltip = ({ active, payload, label, formatDate }) => {
    if (!active || !payload?.length) return null

    const closePrice = payload[0].value

    return (
        <div className="custom-tooltip">
            <p className='tooltip-date'>{formatDate(label)}</p>
            <strong className='tooltip-price'>${closePrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}</strong>
        </div>
    )
}