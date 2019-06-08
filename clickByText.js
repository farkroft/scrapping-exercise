const puppeteer = require('puppeteer');

const escapeXpathString = str => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};

const clickByText = async (page, text) => {
  const escapedText = escapeXpathString(text);
  const linkHandlers = await page.$x(`//a[contains(text(), ${escapedText})]`);
  
  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error(`Link not found: ${text}`);
  }
};

const run = async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: false});
  const page = await browser.newPage();
  await page.goto('https://en.wikipedia.org/wiki/List_of_The_Sandman_characters');
  await clickByText(page, `Fiddler's Green`);
  await page.waitFor(3000)
  await page.waitForNavigation({waitUntil: 'load'});
  console.log("Current page:", page.url());
  return browser.close();
};

const logErrorAndExit = err => {
  console.log(err);
  process.exit();
};

run().catch(logErrorAndExit);