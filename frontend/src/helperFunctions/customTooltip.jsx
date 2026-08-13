import './customTooltip.css'

export const CustomTooltip = ({ active, payload, label, formatDate }) => {
    if (!active || !payload.length) return

    const value = payload[0].value

    return (
        <div className="custom-tooltip">
            <p>{formatDate(label)}</p>
            <strong>${value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}</strong>
        </div>
    )
}