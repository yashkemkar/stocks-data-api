// step 1 - define the web scraper

const cheerio = require('cheerio')
const puppeteer = require('puppeteer')


let type = 'history'

async function scrapeData(url) {
    if (!url) { return }
    
    const url = `https://finance.yahoo.com/quote/${ticker}/${type}?p=${ticker}`
    
    
    // Launch a new browser instance
    const browser = await puppeteer.launch({ headless: true })

    // Open a new page in the browser
    const page = await browser.newPage()

    // Navigate to the desired URL
    await page.goto(url)

    // Wait for the table's 6th column to load on the page (this ensures we wait for data to appear)
    await page.waitForSelector('td:nth-child(6)')

    // Extract the text content of all elements that match the selector 'td:nth-child(6)'
    const data = await page.evaluate(() => {
        // Select all elements that match the 'td:nth-child(6)' selector
        const elements = document.querySelectorAll('td:nth-child(6)')
        // Map over the elements and extract their text content into an array
        return Array.from(elements).map(element => element.textContent.trim())
    })

    // Close the browser instance
    await browser.close()

    // Return the extracted data array
    return data
}
// async function scrapeData(ticker) {
//     try {
//         // step a - fetch the page html
//         const url = `https://finance.yahoo.com/quote/${ticker}/${type}?p=${ticker}`
//         const res = await fetch(url)
//         const html = await res.text()

//         const $ = cheerio.load(html)
//         const price_history = getPrices($)
//         return price_history
//         console.log(price_history)
//     } catch (err) {
//         console.log(err.message)
//     }
// }

async function fetchHTML(ticker, type) {
    const url = `https://finance.yahoo.com/quote/${ticker}/${type}?p=${ticker}`
    let headers = {
        "Content-Type": "application/json",
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Connection': 'keep-alive',
    }
    const res = await fetch(url, {
        method: 'GET',
        headers: headers
    })
    const html = await res.text()
    return html
}

function getPrices(cher) {
    const close_prices = cher('td:nth-child(6)').get().map((current_value) => {
        return cher(current_value).text()
    })
    return close_prices
}

// step 2 - initialize server that serves up an html file that the user can play with

const express = require('express')
const app = express()
const port = 8080

// middleware
app.use(express.json())
app.use(require('cors')())
app.use(express.static('public'))

// step 3 - define api endpoints to access stock data (and call webscraper)

app.get('/test', async (req, res) => {
    const html = await fetchHTML(ticker, type)
    return html
})

app.post('/api', async (req, res) => {
    const { stock_ticker: ticker } = req.body
    console.log(ticker)
    const prices = await scrapeData(ticker,type)
    res.status(200).send({ prices })
})

app.listen(port, () => { console.log(`Server has started on port: ${port}`) })