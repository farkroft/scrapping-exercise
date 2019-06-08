const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

function run() {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto("https://www.bankmega.com/promolainnya.php");
            let baseUrl = "https://www.bankmega.com";

            let bodyHTML
            let promo = [];
            let result = {};

            // loop through categories
            const categories = await page.$$eval('#subcatpromo > div > img', ids => ids.map(id => id.getAttribute('id')))

            // loop through the selected element
            for (let cat of categories) {
                result[`${cat}`] = []
                
                await page.click(`img#${cat}`)
                await page.waitFor(2000)

                if (await page.$('#imgClass') !== null) {
                    console.log('found');
                    // select element attribute
                    const hrefs = await page.evaluate(
                        () => Array.from(document.body.querySelectorAll('#promolain > li > a'), ({ href }) => href)
                    );
                    
                    // open new page simultaneously
                    async function multiPage(arr) {
                        try {
                            const browser = await puppeteer.launch();
        
                            const openPage = arr.map(async (i) => {
                                const page = await browser.newPage();
                            
                                await page.goto(i, {
                                    waitUntil: 'networkidle0',
                                    timeout: 120000,
                                });
                                const title = await page.$eval('.titleinside > h3', el => el.textContent)
                                const area = await page.$eval('.area > b', el => el.textContent)
                                const period = await page.$$eval('.periode > b', elem => elem.map(el => el.textContent))
                                const ket = await page.$eval('.keteranganinside > img', el => el.getAttribute('src'))
                                
                                
                                // console.log(result)
                                await page.close();
                            });
                        
                            Promise.all(openPage).then(() => {
                                browser.close();
                            });
                        } catch (error) {
                            console.log(error);
                        }
                        result[`${cat}`].push({
                            title: title,
                            area: area,
                            periode: period,
                            keterangan: ket
                        })
                    }
                } else {
                    console.log('not found');
                }
                    
                console.log(result);
            }

            await browser.close();
        } catch (e) {
            return reject(e);
        }
    })
}

run().then(console.log).catch(console.error);