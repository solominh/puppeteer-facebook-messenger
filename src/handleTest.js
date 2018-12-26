require('dotenv').config();
const {
  openChatWindow,
  sendMessage,
  getBotReplyTextMessages,
} = require('./facebookMessengerParser');
const settings = require('./settings.json');
const moment = require('moment');

const {
  fetchTestCases,
  saveTestResult,
  fetchScenarioFilePaths,
} = require('./testManager');

const handleTest = () => {
  const handleScenarios = async page => {
    const scenarioFilePaths = await fetchScenarioFilePaths();
    const resultDirname = moment().format('MMM_D_YYYY_HH_mm_ss');
    console.log(scenarioFilePaths);
    for (let scenarioFilePath of scenarioFilePaths) {
      try {
        const testCases = await fetchTestCases(scenarioFilePath);
        const testCasesResult = await handleTestCases(page, testCases);
        await saveTestResult(resultDirname, scenarioFilePath, testCasesResult);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleTestCases = async (page, testCases) => {
    for (let test of testCases) {
      try {
        await handleTest(page, test);
        // await page.waitFor(500);
      } catch (error) {
        console.log(error);
      }
    }

    return testCases;
  };

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

  return {
    handleScenarios,
    handleTestCases,
    handleTest,
  };
};

module.exports = handleTest();
