const puppeteer = require('puppeteer');
const select = require('puppeteer-select');
const url = 'https://www.bankmega.com/promolainnya.php';
const fs = require('fs');
const cheerio = require('cheerio');

// get promo categories
async function getCategories(page) {
    return await page.$$eval('#subcatpromo > div > img', ids => ids.map(id => id.getAttribute('id')))
}

// get pagination
async function getPages(page) {
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
}

// main function
async function main() {
    const browser = await puppeteer.launch({headless: false, slowMo: 250});
    const page = await browser.newPage();

    await page.goto(url);

    const categories = await getCategories(page);
    let result = {};

    loop through the categories
    for (let cat of categories) {
        result[`${cat}`] = []
        console.log('category ' + cat)
        
        await page.click(`img#${cat}`)
        await page.waitFor(2000)

        const pages = await getPages(page);
        if (pages.length > 10) {
            console.log('page lebih dari 10')
            
        } else {
            console.log('kurang dari 10')
            
        }
    }
    
    await page.close();
    await browser.close();
}

main();