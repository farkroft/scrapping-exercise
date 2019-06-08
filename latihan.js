const puppeteer = require('puppeteer');
const select = require('puppeteer-select');
const url = 'https://www.bankmega.com/promolainnya.php';
const fs = require('fs');
const cheerio = require('cheerio');
const Promise = require('bluebird');

function run() {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(url);
            let bodyHTML = await page.content();
            let $ = cheerio.load(bodyHTML);
            
            // const period = await page.$$eval('.tablepaging > tbody > tr > td > a[id]', elem => elem.map((el) => el.textContent))
            // const period = await page.$$('.page_promo_lain')
            let clickPage = $('a.page_promo_lain:contains(7)')
            console.log(clickPage)
            await browser.close();
        } catch (e) {
            return reject(e);
        }
    })
}

run().then(console.log).catch(console.error);