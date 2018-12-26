require('dotenv').config();
const puppeteer = require('puppeteer');
const { loginFacebook } = require('./loginFacebook');
const {
  openChatWindow,
  sendMessage,
  getBotReplyTextMessages,
} = require('./facebookMessengerParser');
const settings = require('./settings.json');
const handleTest = require('./handleTest');
const { getProjectSettings } = require('./testManager');

const main = async () => {
  let browser;
  let page;

  const setup = async () => {
    console.log('Start');
    browser = await puppeteer.launch({
      headless: settings.headless,
      // slowMo: 400,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-notifications',
      ],
    });
    page = await browser.newPage();
    await page.setViewport({
      width: 1000,
      height: 700,
    });
  };

  const teardown = async () => {
    console.log('Done');

    await page.close();
    await browser.close();
  };

  await setup();

  try {
    await loginFacebook(page);
  } catch (error) {
    console.log(error);
    console.log('FAILED TO LOGIN TO FACEBOOK');
    throw error;
  }

  const projectSettings = await getProjectSettings();
  await page.goto(projectSettings.url);
  await openChatWindow(page);
  await page.waitFor(2000);

  await handleTest.handleScenarios(page);

  await teardown();
};

main();
