const puppeteer = require('puppeteer');
const chalk = require('chalk');
var fs = require('fs');

const error = chalk.bold.red;
const success = chalk.keyword("green");

(async () => {
    try {
        var browser = await puppeteer.launch({ headless: false });
        var page = await browser.newPage();

        await page.goto('https://news.ycombinator.com/');
        await page.waitForSelector("a.storylink");

        var news = await page.evaluate(() => {
            var titleNodeList = document.querySelectorAll('a.storylink');
            var ageList = document.querySelectorAll('span.age');
            var scoreList = document.querySelectorAll('span.score');
            var titleLinkArray = [];
            for (var i = 0; i < titleNodeList.length; i++) {
                titleLinkArray[i] = {
                    title: titleNodeList[i] && titleNodeList[i].innerText.trim(),
                    link: titleNodeList[i] && titleNodeList[i].getAttribute("href"),
                    age: ageList[i] && ageList[i].innerText.trim(),
                    score: scoreList[i] && scoreList[i].innerText.trim()
                };
            }
            return titleLinkArray;
        })

        await browser.close();

        fs.writeFile("hackernews.json", JSON.stringify(news), function(err) {
            if (err) throw err;
            console.log("Saved!");
        });
        console.log(success('Browser Closed'));
    } catch (err) {
        console.log(error(err));
        await browser.close();
        console.log(error("Browser Close"));
    }
})();