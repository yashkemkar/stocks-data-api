// step 1 - define the web scraper

const cheerio = require('cheerio')

let stockTicker = 'pypl'
let type = 'history'

async function scrapeData(ticker) {
    try {
        // step a - fetch the page html
        const url = `https://finance.yahoo.com/quote/${ticker}/${type}?p=${ticker}`
        const res = await fetch(url)
        const html = await res.text()

        const $ = cheerio.load(html) //this syntax is specific to the web scraper
        const price_history = getPrices($)
        console.log(price_history)
        return price_history
        
    } catch (err) {
        console.log(err.message)
    }
}

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
    const $ = cheerio.load(html)
    return html
    
}

function getPrices(cher) {
    const prices = cher('td:nth-child(6)').get().map((current_value) => { // we need to target the class which is a table hence td, and within that use the n-th child operator to target a specific column. Get() pulls every single value into an array, and map() over the array to return each value.
        return cher(current_value).text()
    })
    return prices
}

// step 2 - initialize server that serves up an html file that the user can play with 

const express = require('express')
const app = express()
const port = 8383

// middleware - when we send data over a network request its often in a .json format. This middleware allows us to automatically parse the json so that we can access it or destructure ticker out of it automatically.
app.use(express.json()) // this tells the app that it should expect .json information
app.use(require('cors')())// this will enable cross-origin requests
app.use(express.static('public')) // this will serve up the index.html file inside of the public directory - this is a much more first principles way of serving up a website rather than using a live server.

// step 3 - define api endpoints to access stock data (and call webscraper)

app.get('/test', async (req, res) => {
    const html = await fetchHTML('pypl', 'history')
    return html
})

app.post('/api', async (req, res) => {
    const { stockTicker: ticker } = req.body //We can destructure the data that has already been parsed in from the .json file using express. So express allows us to automatically convert json libraries into objects. The req.body is literally the body of the request or the data that gets sent across - we are destructuring it.
    console.log(ticker)
    const prices = await scrapeData(ticker)
    res.status(200).send({ prices }) // You need a response message to a post request
})
// this says that we should listen to incoming post requests from the website. this is an api endpoint

app.listen(port, () => { console.log(`Server has started on port: ${port}`) }) //When the app is listening, file is up and running the whole time - hence the nodemon dev command to restart whenever changes are made to the file.

