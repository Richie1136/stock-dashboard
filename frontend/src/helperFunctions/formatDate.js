export const formatDate = (date) => {
    if (!date) return "N/A"
    if (date.split(" ").length === 1) {
        return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
            month: "long",
            day: "numeric",
            year: "numeric"
        })
    } else {
        return new Date(`${date}`).toLocaleDateString('en-US', {
            month: "long",
            day: "numeric",
            year: "numeric"
        })
    }
}