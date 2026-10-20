export const StarRating = ({ rating }) => {
    if (rating === null) return "N/A"

    return (
        <span>
            {Array.from({ length: 5 }, (_, index) => (
                <span key={index} style={{ color: index < rating ? "#E5A000" : "#D1D5DB" }}>
                    ★
                </span>
            ))}
        </span>
    )
}