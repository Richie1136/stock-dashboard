export const formatDate = (date, yearFormat = "2-digit") => {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        month: "2-digit",
        day: "2-digit",
        year: yearFormat
    })
}