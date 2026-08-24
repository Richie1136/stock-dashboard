import { useState, useEffect } from 'react'
import './NewsCard.css'
import Loading from '../loading/Loading'
import { apiBaseUrl } from '../../utils/apiConfig'
import { formatNewsDate } from '../../helperFunctions/formatNewsDate'

const NewsCard = ({ symbol }) => {
    const [companyNews, setCompanyNews] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")


    useEffect(() => {
        if (!symbol) return
        // Cancel stale requests when the selected symbol changes or this card unmounts.
        const controller = new AbortController()
        const getCompanyNews = async () => {
            try {
                setIsLoading(true)
                setError("")
                const response = await fetch(`${apiBaseUrl}/company-news/${symbol}`, {
                    signal: controller.signal
                })
                if (!response.ok) {
                    throw new Error(`News Data request failed with status ${response.status}`
                    )
                }
                const data = await response.json()
                setCompanyNews(data)
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setCompanyNews([])
                    setError("Unable to load company news")
                }

            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }
        getCompanyNews()
        return () => {
            controller.abort()
        }
    }, [symbol])

    const formatNewsSource = (source) => {
        if (!source) return ""

        switch (source) {
            case "SeekingAlpha":
                return "Seeking Alpha"
            default:
                return source;
        }

    }


    return (
        <div className='card news-list'>
            <h2>Company News</h2>
            {isLoading && <Loading />}
            {error && <p>{error}</p>}
            {!symbol && <h4>{"Search for a stock or ETF to view company news."}</h4>}
            {/* Keep the card compact even when the provider returns a larger news batch. */}
            <div className='news-scroll'>
                <div className='news-card-list'>
                    {companyNews.map((article) => {
                        const { headline, source, summary, id, datetime, url } = article
                        return (
                            <article className='news-card' key={id}>
                                <div className='news-card-content'>
                                    <p className='news-card-source'>{formatNewsSource(source)} • {formatNewsDate(datetime)}</p>
                                    <h3 className='news-card-headline'><a href={url} rel="noopener noreferrer" target='_blank'>{headline}</a></h3>
                                    <p className='news-card-summary'>{summary}</p>
                                </div>
                            </article>
                        )
                    })}
                </div>
            </div>
        </div >
    )
}

export default NewsCard