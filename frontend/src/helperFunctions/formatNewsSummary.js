export const formatNewsSummary = (summary) => {

    if (!summary) return ""

    let divValue = document.createElement("div")
    divValue.innerHTML = summary
    let readValue = divValue.textContent


    let fixedSummary = readValue

    fixedSummary = fixedSummary
        .replaceAll("â\x80\x99", "'")
        .replaceAll("\u00e2\u0080\u009c", "\"")
        .replaceAll("\u00e2\u0080\u009d", "\"")
        .replaceAll("\u00e2\u0080\u0094", "—")

    return fixedSummary.trim()
}