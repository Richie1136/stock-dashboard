import { monthNames } from "../constants/monthNames";


export const formatIPOLayout = (ipo) => {
    if (!ipo) {
        return "N/A"
    }

    const ipoOnly = ipo.split("T")[0]
    const [year, month, day] = ipoOnly.split("-")

    return `${monthNames[month]} ${day}, ${year}`
}