// 확진자 통계를 가져올 지역 명 (Seoul 또는  서울)
const areaCode = 'Seoul';

// 오늘 기준 차감 일 - API업데이트가 늦어지면 -1 씩 차감
let minDay = 0;
const request = require('request');
const xml = require('xml-parse');
const { getAPIURL, extractData, genSlackMsg, getDate,
  parseCliFlagValue, showError, readDateLog, writeDateLog } = require('./lib');

// 입력 오류 체킹
const environment = parseCliFlagValue('env');

if(environment !== 'prod' && environment !== 'test') {
    let msg = '!!Error!! --env 플래그가 잘못 되었습니다.\n';
    msg += '바른예) node index.js --env=test';

    console.error(msg);
    return false;
}
require('dotenv').config({path: `.env.${environment}`});


// 로그 파일 명 (날짜 정보를 저장해서 이미 보낸 정보면  스킵하도록 함)
const logFile = `./date.${environment}.log`;

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
      writeDateLog(logFile, data.date);
    }
    else {
      showError(response, options);
    }
  }

  request(options, callback);
};

// 코로나 정부 제공 API 호출
const callAPI = areaCode => {
  const date = getDate(minDay);
  const url = getAPIURL('gov', date);
  const options = { url, method: 'GET' };

  const callback = (error, response, body) => {
    let dataTemp, dataArea, dataTotal;

    if (!error && response.statusCode === 200) {
      const parsedData = xml.parse(body);
      const pNode = parsedData[1].childNodes[1].childNodes[0];

      if(typeof pNode.childNodes === 'undefined') {
        if(minDay === 0) {
          minDay += 1;
          //console.log(date);
          console.log('* Notice: 최근 날짜가 없어서 하루 전 데이타를 호출 합니다...\n');
          callAPI(areaCode);
          return true;
        }
        else {
          console.error("아직 데이타가 업데이트 되지 않았습니다.\n");
          console.error(`* 호출 URL : ${url}\n`);
          console.error(parsedData);

          return false;
        }
      }

      for (const node of pNode.childNodes) {
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

      // 이미 보낸 슬랙 웹훅인지 체킹
      const numPrevDate = Number(readDateLog(logFile));
      const numChkDate = Number(`${date.year}${date.mon}${date.day}`);
      //console.log(numChkDate > numPrevDate, numChkDate, numPrevDate);

      if (numChkDate > numPrevDate) {
        callWebhook({ area: dataArea, total: dataTotal, date });
      } else {
        console.log(`* Skipped!!! 이미 전송된 날짜 정보 임! ${numChkDate} <= ${numPrevDate}`);
      }
    }
    else {
      showError(response, options);
    }
  };

  request(options, callback);
};

callAPI(areaCode);
