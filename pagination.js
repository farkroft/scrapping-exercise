const puppeteer = require('puppeteer');
const select = require('puppeteer-select');
const url = 'https://www.bankmega.com/promolainnya.php';
const fs = require('fs');
const cheerio = require('cheerio');

// get promo categories
async function getCategories(page) {
    return await page.$$eval('#subcatpromo > div > img', ids => ids.map(id => id.getAttribute('id')))
}

// get the details of promo
async function getDetails(browser, url) {
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 120000,
    });
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
        periode: period,
        keterangan: ket
    }
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

async function findByText(page, linkString) {
    const links = await page.$$('a.page_promo_lain[id]')
    for (var i=0; i < links.length; i++) {
      let valueHandle = await links[i].getProperty('innerText');
      let linkText = await valueHandle.jsonValue();
    //   const text = getText(linkText);
      if (linkString == linkString) {
        // console.log(linkString);
        // console.log(text);
        console.log("Found");
        return page.click(links[i])
        // return links[i];
      }
    }
    return null;
}

// main function
async function main() {
    const browser = await puppeteer.launch({headless: false, slowMo: 250});
    const page = await browser.newPage();

    await page.goto(url);
    await page.click(`img#fnb`)
    await page.waitFor(2000)
    let result = [];

    const pages = await getPages(page);
    for (let activePage of pages) {
        console.log('page sekarang ' + activePage)
        // await page.waitForNavigation({ waitUntil: 'networkidle0' })
        await page.waitFor(2000)
        let visiblePage = await page.$$eval('.tablepaging > tbody > tr > td > a[id]', elem => elem.map((el) => el.textContent))
        let lastVisiblepage = visiblePage[visiblePage.length-1]
        await select(page).assertElementPresent(`a.page_promo_lain:contains(${activePage})`)
        let clickPage = await select(page).getElement(`a.page_promo_lain:contains(${activePage})`)
        await clickPage.click()

        // if promo exist
        if (await page.$('#imgClass') !== null) {
            // get href promo
            let hrefs = await page.evaluate(
                () => Array.from(document.body.querySelectorAll('#promolain > li > a'), ({ href }) => href)
            );

            // for (let href of hrefs) {
            //     const detail = await getDetails(browser, href)
            //     try {
            //         Promise.all(detail)
            //         .then(result[`${cat}`].push(detail))
            //         .catch((err) => {
            //             console.log(err.message)
            //         })
            //     } catch (err) {
            //         console.log(err)
            //     }
            // }
            for (let href of hrefs) {
                const detail = await getDetails(browser, href)
                // result[`${cat}`].push(detail);
                result.push(detail);
            }
        } else {
            console.log('Promo not found!');
        }

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
}

main();