const path = require('path');
const csv = require('csvtojson');
const json2csv = require('json2csv').parse;
const fs = require('fs-extra');
const XRegExp = require('xregexp');
const settings = require('./settings.json');
const moment = require('moment');

// Simple and work fine. But using library will work for all cases
// const parseOutput=(str)=>{
//     let arr = output.match(/^\[.*\]$/gm);
//     arr = arr
//       .map(str => str.substring(1, str.length - 1))
//       .map(str => str.trim());
//     return arr;
// }
// Use library
const parseOutput = str => {
  return XRegExp.matchRecursive(str, '\\[', '\\]', 'g');
};

const fetchScenarioFilePaths = async () => {
  const scenarioPath = path.join(__dirname, '../scenarios');

  console.log(scenarioPath);
  const { scenarioFileNames } = settings;
  return scenarioFileNames
    .map(p => path.join(scenarioPath, p))
    .filter(p => fs.existsSync(p));
};

const fetchTestCases = async scenarioFilePath => {
  const csvFilePath = path.join(scenarioFilePath);
  const jsonArray = await csv().fromFile(csvFilePath);
  console.log(jsonArray);

  // Parse output
  jsonArray.map(test => {
    let { input, output } = test;
    input = input.trim();
    output = output.trim();

    test.outputArr = output.startsWith('[') ? parseOutput(output) : [output];
    test['error_message'] = '';
    test['test_result'] = '';
  });

  return jsonArray;
};

const saveTestResult = async (resultDirname, scenarioFilePath, testCases) => {
  const resultPath = path.join(__dirname, '../scenarios_results');
  const scenarioFileName = path.basename(scenarioFilePath);
  const resultFilePath = path.join(resultPath, resultDirname, scenarioFileName);

  try {
    const fields = ['order', 'input', 'output', 'test_result', 'error_message'];
    const opts = { fields };
    const csv = json2csv(testCases, opts);
    await fs.outputFile(resultFilePath, csv);
    console.log(csv);
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  fetchScenarioFilePaths,
  fetchTestCases,
  saveTestResult,
};
