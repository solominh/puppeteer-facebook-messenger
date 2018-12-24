const puppeteer = require('puppeteer');
const { loginFacebook } = require('./loginFacebook');
const {
  sendMessage,
  getBotReplyTextMessages,
} = require('./facebookMessengerParser');
const tests = require('./tests.json');

const main = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    // slowMo: 400,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-notifications',
    ],
  });

  let page = await browser.newPage();
  await page.setViewport({
    width: 1000,
    height: 700,
  });

  await loginFacebook(page);
  await page.goto(tests.url);

  for (let test of tests.tests) {
    await sendMessage(page, test.ask);
    let textMessages = await getBotReplyTextMessages(page);
    console.log(textMessages);
    await page.waitFor(2000);
  }

  console.log('Done.');
};

main();
