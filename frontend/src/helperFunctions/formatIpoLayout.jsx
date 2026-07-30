import { monthNames } from "../constants/monthNames";


export const formatIPOLayout = (ipo) => {
    if (!ipo) {
        return "N/A"
    }
    const year = ipo.split('-')[0]
    const month = ipo.split('-')[1]
    const day = ipo.split('-')[2]
    return `${monthNames[month]} ${day}, ${year}`
}