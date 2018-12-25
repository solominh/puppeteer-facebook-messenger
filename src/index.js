require('dotenv').config();
const puppeteer = require('puppeteer');
const { loginFacebook } = require('./loginFacebook');
const {
  sendMessage,
  getBotReplyTextMessages,
} = require('./facebookMessengerParser');

const { fetchTestCases, saveTestResult } = require('./testManager');

const main = async () => {
  let browser;
  let page;
  const { TEST_URL } = process.env;

  const setup = async () => {
    console.log('Start');
    browser = await puppeteer.launch({
      headless: false,
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

  await page.goto(TEST_URL);

  let testCases;
  try {
    testCases = await fetchTestCases();
  } catch (error) {
    console.log(error);
    console.log('FAILED TO READ TEST CASES');
    throw error;
  }

  const handleTest = async (page, test) => {
    try {
      await sendMessage(page, test.input);
    } catch (error) {
      console.log(error);
      console.log('FAILED TO SEND MESSAGE');
      test['error_message'] = `FAILED TO SEND MESSAGE: ${error.message}`;
      throw error;
    }

    let textMessages;
    try {
      textMessages = await getBotReplyTextMessages(page);
    } catch (error) {
      console.log(error);
      console.log('FAILED TO RECEIVE MESSAGE');
      test['error_message'] = `FAILED TO RECEIVE MESSAGE: ${error.message}`;
      throw error;
    }

    let index = 0;
    let isPassed = true;
    const { outputArr } = test;
    for (let reply of outputArr) {
      if (reply !== textMessages[index]) {
        isPassed = false;
        test['error_message'] += `${index + 1}. Bot reply: ${
          textMessages[index]
        }\n`;
      }
      index++;
    }
    test['test_result'] = isPassed ? 'Passed' : 'Failed';
  };

  for (let test of testCases) {
    await handleTest(page, test);
    await page.waitFor(2000);
  }

  await saveTestResult(testCases);

  await teardown();
};

main();
