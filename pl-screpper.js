const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const url = 'https://www.bankmega.com/promolainnya.php';

promos = [];

axios(url)
.then(response => {
    const html = response.data;
    const $ = cheerio.load(html);
    const promo = $('#subcatpromo > div > img');

    promo.each(function() {
        const namePromo = $(this).attr('id')
        promos.push(namePromo);
    })
    console.log(promos);
})
.catch(console.error);