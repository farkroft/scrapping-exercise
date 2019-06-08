const puppeteer = require('puppeteer');
const select = require('puppeteer-select');
const url = 'https://www.bankmega.com/promolainnya.php';
const fs = require('fs');
const cheerio = require('cheerio');
const Promise = require('bluebird')

// get promo categories
async function getCategories(page) {
    try {
        return await page.$$eval('#subcatpromo > div > img', ids => ids.map(id => id.getAttribute('id')))
    } catch (err) {
        console.log(err)
    }
}

// get the details of promo
async function getDetails(browser, url) {
    try {
        const page = await browser.newPage();
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 120000,
        });
        let bodyHTML = await page.content();
        let $ = cheerio.load(bodyHTML);
        let periode = $('.periode > b').text();
        const title = await page.$eval('.titleinside > h3', el => el.textContent)
        const area = await page.$eval('.area > b', el => el.textContent)
        const period = await page.$$eval('.periode > b', elem => elem.map(el => el.textContent))
        let ket = ''
        if (await page.$('.keteranganinside > img') !== null) {
            ket = await page.$eval('.keteranganinside > img', el => el.getAttribute('src'))
        } else if (await page.$('.keteranganinside > a > img') !== null) {
            ket = await page.$eval('.keteranganinside > a > img', el => el.getAttribute('src'))
        } else {
            ket = await page.$eval('.keteranganinside > p > img', el => el.getAttribute('src'))
        }

        page.close()

        return await {
            title: title,
            area: area,
            periode: periode,
            keterangan: ket
        }
    } catch (err) {
        console.log(err)
    }
}

// get pagination
async function getPages(page) {
    try {
        let first = await page.$$eval('.tablepaging > tbody > tr > td > a[id]', elem => elem.map((el) => el.textContent))
        const firstFirst = first[0]
        const lastFirst = first[first.length-1]
        await select(page).assertElementPresent(`a.page_promo_lain:contains(${lastFirst})`)
        const lastPage = await select(page).getElement(`a.page_promo_lain:contains(${lastFirst})`)
        await lastPage.click();
        console.log('click')
        await page.waitFor(2000)
        await select(page).assertElementPresent('a.page_promo_lain:contains(Next Page)')
        const next = await select(page).getElement('a.page_promo_lain:contains(Next Page)')
        await next.click();
        await page.waitFor(4000)
        const second = await page.$$eval('.tablepaging > tbody > tr > td > a[id]', elem => elem.map((el) => el.textContent))
        const lastSecond = second[second.length-1]
        if (lastFirst != lastSecond) {
            first = first.concat(second)
            const prevClick = await select(page).getElement(`a.page_promo_lain:contains(Prev Page)`)
            prevClick.click()
            const firstClick = await select(page).getElement(`a.page_promo_lain:contains(${firstFirst})`)
            firstClick.click()
        } else {
            first = first
            const firstClick = await select(page).getElement(`a.page_promo_lain:contains(${firstFirst})`)
            firstClick.click()
        }

        return await first
    } catch (err) {
        console.log(err)
    }
}

// main function
async function main() {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        await page.goto(url);
        await page.click(`img#fnb`)
        await page.waitFor(2000)
        let result = []

        const pages = await getPages(page);
        console.log(pages);
        // Promise.map(values, mapper)
        for (let activePage of pages) {
            // console.log('page sekarang ' + activePage)
            await page.waitFor(2000)
            let visiblePage = await page.$$eval('.tablepaging > tbody > tr > td > a[id]', elem => elem.map((el) => el.textContent))
            console.log(visiblePage)
            let lastVisiblepage = visiblePage[visiblePage.length-1]
            console.log(lastVisiblepage)
            // await select(page).assertElementPresent(`a.page_promo_lain:contains(${activePage})`)
            // let clickPage = $('a.page_promo_lain')
            let bodyHTML = await page.content();
            let $ = cheerio.load(bodyHTML);
            let clickPage = await select(page).getElement(`a.page_promo_lain:contains(${activePage})`)
            // let clickPage = $(`a.page_promo_lain:contains(${activePage})`)
            debugger;
            await clickPage.click()

            if (activePage == lastVisiblepage) {
                await page.waitFor(4000)
                await select(page).assertElementPresent(`a.page_promo_lain:contains(Next Page)`)
                let clickPage = await select(page).getElement(`a.page_promo_lain:contains(Next Page)`)
                await clickPage.click();
                await page.waitFor(2000)
            }
        }

        await page.close();
        await browser.close();
    } catch (err) {
        console.log(err)
    }
    // fs.writeFile("solution.json", JSON.stringify(result), function(err) {
    //     if (err) throw err;
    //     console.log("Saved!");
    // })
}

main();