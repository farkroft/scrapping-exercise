const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const urls = [
      'https://www.google.com',
      'https://www.duckduckgo.com',
      'https://www.bing.com',
    ];
    const pdfs = urls.map(async (url, i) => {
      const page = await browser.newPage();

      console.log(`loading page: ${url}`);
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 120000,
      });

      console.log(`saving as pdf: ${url}`);
      await page.pdf({
        path: `${i}.pdf`,
        format: 'Letter',
        printBackground: true,
      });

      console.log(`closing page: ${url}`);
      await page.close();
    });

    Promise.all(pdfs).then(() => {
        browser.close();
      });
    } catch (error) {
      console.log(error);
    }
})();