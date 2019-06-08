const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

function run() {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto("https://www.bankmega.com/promolainnya.php");
            let baseUrl = "https://www.bankmega.com/";

            let bodyHTML = await page.content();

            subcats = [];
            result = [];

            let $ = cheerio.load(bodyHTML);
            let categories = $('#subcatpromo').children().find('img');
            let subcat = categories.each(function(i, item) {
                subcats.push(item.attribs);
            })

            // for (let i = 0; i < subcats.length; i++) {
            //     await page.click(`#${subcats[i].id}`)
            //     await page.waitFor(1000)
            // }

            promo = [];

            let promos = $('#promolain').children().children();
            let dataPromo = promos.each(function(i, item) {
                promo.push({
                    url: item.attribs.href,
                    title: item.firstChild.next.attribs.title
                });
            })
            console.log(promo);

            // open new page simultaneously
            async function multiPage() {
                try {
                    const browser = await puppeteer.launch({headless: false});
  
                    const pdfs = promo.map(async (url, i) => {
                        const page = await browser.newPage();
                    
                        await page.goto(baseUrl+url.url, {
                            waitUntil: 'networkidle0',
                            timeout: 120000,
                        });
                    
                        let bodyHTML = await page.content();
                        let $ = cheerio.load(bodyHTML);
                        let categories = $('.area').children().text();
                        console.log(categories);

                        await page.close();
                    });
                
                    Promise.all(pdfs).then(() => {
                        browser.close();
                    });
                } catch (error) {
                    console.log(error);
                }
            }

            multiPage();

            // for (let i = 0; i < promo.length; i++) {
            //     await browser.newPage();
            //     await page.goto(baseUrl+promo[i].url, {
            //         timeout: 2000
            //     });
            //     console.log('open')
            //     await page.close()
            //     console.log('close')
            // }

            // console.log(page.url());
            // let ccButton = await page.$('#kartukredit');
            // await ccButton.click();

            // await page.waitFor(2000);
            // await page.waitForSelector('img#travel');
            // await page.click('img#travel');
            // await page.waitFor(2000);

            // let urls = await page.evaluate(() => {
            //     let results = [];
            //     let items = document.querySelectorAll('#imgClass');
            //     items.forEach((item) => {
            //         results.push({
            //             url:  item.getAttribute('src'),
            //             title: item.getAttribute('title')
            //         });
            //     });
            //     return results;
            // })
            await browser.close();
            // return resolve(urls);
        } catch (e) {
            return reject(e);
        }
    })
}

run().then(console.log).catch(console.error);