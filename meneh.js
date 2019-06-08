const puppeteer = require('puppeteer');
const select = require('puppeteer-select');
const url = 'https://www.bankmega.com/promolainnya.php';
const baseUrl = 'https://www.bankmega.com'
const fs = require('fs');
const cheerio = require('cheerio');
const Promise = require('bluebird');

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

        return {
            title: title,
            area: area,
            periode: periode,
            imageUrl: baseUrl+ket
        }
    } catch (err) {
        console.log(err)
    }
}

// get pagination
async function getPages(page, cat) {
    try {
        console.log('inspect pages')
        let first = await page.$$eval('.tablepaging > tbody > tr > td > a[id]', elem => elem.map((el) => el.textContent))
        const firstFirst = first[0]
        const lastFirst = first[first.length-1]
        // console.log(first)
        await select(page).assertElementPresent(`a.page_promo_lain:contains(${lastFirst})`)
        const lastPage = await select(page).getElement(`a.page_promo_lain:contains(${lastFirst})`)
        await lastPage.click();
        console.log('click inspect pages')
        await page.waitFor(2000)
        await select(page).assertElementPresent('a.page_promo_lain:contains(Next Page)')
        const next = await select(page).getElement('a.page_promo_lain:contains(Next Page)')
        await next.click();
        await page.waitFor(4000)
        const second = await page.$$eval('.tablepaging > tbody > tr > td > a[id]', elem => elem.map((el) => el.textContent))
        // console.log(second)
        const lastSecond = second[second.length-1]
        if (lastFirst !== lastSecond) {
            // console.log('lewat atas')
            await page.click(`img#${cat}`)
            await select(page).assertElementPresent(`a.page_promo_lain:contains(${firstFirst})`)
            await page.waitFor(2000)
            first = first.concat(second)
            return await first
        } else {
            // console.log('lewat bawah')
            first = first
            const firstClick = await select(page).getElement(`a.page_promo_lain:contains(${firstFirst})`)
            await firstClick.click()
            return first
        }

        // return first
    } catch (err) {
        console.log(err)
    }
}

// main function
async function main() {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto(url);
        console.log('opening ' + url)
        const categories = await getCategories(page);
        console.log(categories)
        let result = {};

        // loop through the categories
        for (let cat of categories) {
            result[`${cat}`] = []
            console.log('category ' + cat)
            
            await page.click(`img#${cat}`)
            await page.waitFor(2000)
            let pages = ''
            // if promo exist then inspect pages
            if (await page.$('#imgClass') !== null) {
                pages = await getPages(page, cat);
            } else {
                break;
            }
            console.log(pages)
            await page.click(`img#${cat}`)
            // determine the behavior pf pagination
            if (pages.length > 10) {
                console.log('page lebih dari 10')
                for (let activePage of pages) {
                    console.log('page sekarang ' + activePage)
                    let visiblePage = await page.$$eval('.tablepaging > tbody > tr > td > a[id]', elem => elem.map((el) => el.textContent))
                    console.log('visible page ' + visiblePage)
                    let lastVisiblepage = visiblePage[visiblePage.length-1]
                    console.log('last page visible ' + lastVisiblepage)
                    let bodyHTML = await page.content();
                    let $ = cheerio.load(bodyHTML);
                    let clickPage = await select(page).getElement(`a.page_promo_lain:contains(${activePage})`)
                    await clickPage.click()

                    // if promo exist
                    if (await page.$('#imgClass') !== null) {
                        // get href promo
                        let hrefs = await page.evaluate(
                            () => Array.from(document.body.querySelectorAll('#promolain > li > a'), ({ href }) => href)
                        );
                        
                        // loop through the promos
                        for (let href of hrefs) {
                            console.log('opening ' + href)
                            const detail = await getDetails(browser, href)
                            try {
                                Promise.props(detail).then(() => {
                                    console.log(detail)
                                    result[`${cat}`].push(detail)
                                }).catch((err) => {
                                    console.log(err.message)
                                })
                            } catch (err) {
                                console.log(err)
                            }
                        }
                    } else {
                        console.log('Promo not found!');
                        break;
                    }

                    if (activePage == lastVisiblepage) {
                        await page.waitFor(4000)
                        await select(page).assertElementPresent(`a.page_promo_lain:contains(Next Page)`)
                        let clickPage = await select(page).getElement(`a.page_promo_lain:contains(Next Page)`)
                        await clickPage.click();
                        await page.waitFor(2000)
                    }
                }
            } else {
                console.log('kurang dari 10')
                for (let activePage of pages) {
                    console.log('page sekarang ' + activePage)
                    await page.waitFor(2000)
            
                    let clickPage = await select(page).getElement(`a.page_promo_lain:contains(${activePage})`)
                    await clickPage.click()
            
                    // if promo exist
                    if (await page.$('#imgClass') !== null) {
                        // get href promo
                        const hrefs = await page.evaluate(
                            () => Array.from(document.body.querySelectorAll('#promolain > li > a'), ({ href }) => href)
                        );

                        for (let href of hrefs) {
                            console.log('opening ' + href)
                            const detail = await getDetails(browser, href)
                            try {
                                Promise.props(detail).then(() => {
                                    console.log(detail)
                                    result[`${cat}`].push(detail)
                                }).catch((err) => {
                                    console.log(err.message)
                                })
                            } catch (err) {
                                console.log(err)
                            }
                        }
                    } else {
                        console.log('Promo not found!');
                    }
                }
            }
            // write promo from category
            fs.writeFile("solution.json", JSON.stringify(result), function(err) {
                if (err) throw err;
                console.log("Saved!");
            });
        }
        
        await page.close();
        await browser.close();
    } catch (err) {
        console.log(err)
    }
    
}

main();