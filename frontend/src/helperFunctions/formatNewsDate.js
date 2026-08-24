export const formatNewsDate = (article) => {
    const convertToMilliseconds = article * 1000
    const articleDate = new Date(convertToMilliseconds).toLocaleDateString('en-US', {
        dateStyle: 'long'
    })
    return articleDate
}