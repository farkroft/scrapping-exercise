const puppeteer = require('puppeteer');
const chalk = require('chalk');

const error = chalk.bold.red;
const success = chalk.keyword("green");

(async () => {
    try {
        var browser = await puppeteer.launch({ headless: false });

        var page = await browser.newPage();

        await page.goto('https://www.gitlab.com');

        await page.screenshot({ path: "example.png" });
        await browser.close();
        console.log(success("Browser Closed"));
    } catch (err) {
        console.log(error(err));
        await browser.close();
        console.log(error("Browser Closed"));
    }
})();