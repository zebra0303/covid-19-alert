// 확진자 통계를 가져올 지역 명 (Seoul 또는  서울)
const areaCode = 'Seoul';

const request = require('request');
const xml = require('xml-parse');
const { getAPIURL, extractData, genSlackMsg,
  parseCliFlagValue, showError } = require('./lib');

// 입력 오류 체킹
const environment = parseCliFlagValue('env');

if(environment !== 'prod' && environment !== 'test') {
    let msg = '!!Error!! --env 플래그가 잘못 되었습니다.\n';
    msg += '바른예) node index.js --env=test';

    console.error(msg);
    return false;
}
require('dotenv').config({path: `.env.${environment}`});


// 슬랙 웹훅 호출
const callWebhook = data => {
  console.log(`* Environment: ${environment}`);

  const headers = { 'Content-type': 'application/json' };
  const url = getAPIURL('slack');
  const body = genSlackMsg(data);
  const options = { url, method: 'POST', headers, body };

  const callback = (error, response, body) => {
    if (!error && response.statusCode == 200) {
      console.log(`* Response: ${body}`);
    }
    else {
      showError(response, options);
    }
  }

  request(options, callback);
};

// 코로나 정부 제공 API 호출
const callAPI = areaCode => {
  const url = getAPIURL('gov');
  const options = { url, method: 'GET' };

  const callback = (error, response, body) => {
    let dataTemp, dataArea, dataTotal;

    if (!error && response.statusCode === 200) {
      const parsedData = xml.parse(body);
      for (const node of parsedData[1].childNodes[1].childNodes[0].childNodes) {
        dataTemp = extractData(node, areaCode);
        if(Object.keys(dataTemp).length > 0) {
          dataArea = dataTemp;
        }

        dataTemp = extractData(node, 'Total');
        if(Object.keys(dataTemp).length > 0) {
          dataTotal = dataTemp;
        }
      }

      console.log(dataArea, dataTotal);
      callWebhook({ area: dataArea, total: dataTotal });
    }
    else {
      showError(response, options);
    }
  };

  request(options, callback);
};

callAPI(areaCode);
