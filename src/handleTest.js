require('dotenv').config();
const {
  openChatWindow,
  sendMessage,
  getBotMessages,
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
    const resultDirname = moment().format('MMM_D_YYYY_hh_mm_ss_a');
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

  const isTextInput = text => {
    return !text.startsWith('[');
  };

  compareBotMessageWithTestOutput = async (page, test) => {
    let messages;
    try {
      messages = await getBotMessages(page);
    } catch (error) {
      console.log(error);
      console.log('FAILED TO RECEIVE MESSAGE');
      test['error_message'] = `FAILED TO RECEIVE MESSAGE: ${error.message}`;
      throw error;
    }

    const { textMessages } = messages;

    const compareTextMessages = (test, textMessages) => {
      let index = 0;
      let isPassed = true;
      const { outputArr } = test;
      for (let reply of outputArr) {
        if (!textMessages[index].toLowerCase().includes(reply.toLowerCase())) {
          isPassed = false;
          test['error_message'] += `${index + 1}. Bot reply: ${
            textMessages[index]
          }\n`;
        }
        index++;
      }
      test['test_result'] = isPassed ? 'Passed' : 'Failed';
    };

    compareTextMessages(test, textMessages);
  };

  handleTextInput = async (page, test) => {
    try {
      await sendMessage(page, test.input);
    } catch (error) {
      console.log(error);
      console.log('FAILED TO SEND MESSAGE');
      test['error_message'] = `FAILED TO SEND MESSAGE: ${error.message}`;
      throw error;
    }

    await compareBotMessageWithTestOutput(page, test);
  };

  handleActionInput = async (page, test) => {
    let messages;
    try {
      messages = await getBotMessages(page);
    } catch (error) {
      console.log(error);
      console.log('FAILED TO RECEIVE MESSAGE');
      test['error_message'] = `FAILED TO RECEIVE MESSAGE: ${error.message}`;
      throw error;
    }

    const actionInput = test.input.substring(1, test.input.length - 1);

    const {
      textMessages,
      quickReplyButtons,
      menuButtons,
      slideItems,
    } = messages;

    let hasButton = false;
    if (quickReplyButtons.length > 0) {
      for (let quickReplyButton of quickReplyButtons) {
        const buttonName = await page.evaluate(
          el => el.textContent,
          quickReplyButton
        );
        if (buttonName.toLowerCase().includes(actionInput.toLowerCase())) {
          quickReplyButton.asElement().click();
          hasButton = true;
          break;
        }
      }
    }

    if (menuButtons.length > 0) {
      for (let menuButton of menuButtons) {
        const buttonName = await page.evaluate(
          el => el.textContent,
          menuButton
        );
        if (buttonName.toLowerCase().includes(actionInput.toLowerCase())) {
          menuButton.asElement().click();
          hasButton = true;
          break;
        }
      }
    }

    // TODO: compare slide items link
    if (slideItems.length > 0) {
      console.log('view button href');
    }

    if (hasButton) {
      await compareBotMessageWithTestOutput(page, test);
    } else {
      test['error_message'] = `Button Input ${actionInput} not exist`;
      test['test_result'] = 'Failed';
    }
  };

  const handleTest = async (page, test) => {
    if (isTextInput(test.input)) {
      await handleTextInput(page, test);
    } else {
      await handleActionInput(page, test);
    }
  };

  return {
    handleScenarios,
    handleTestCases,
    handleTest,
  };
};

module.exports = handleTest();
