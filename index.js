const request = require('request');
const xml = require('xml-parse');
const { getDate, getAPIURL, extractData, parseCliFlagValue } = require('./lib');

const environment = parseCliFlagValue('env');
if(environment !== 'prod' && environment !== 'test') {
    console.error("!!Error!! --env 플래그가 잘못 되었습니다.\n바른예) node index.js --env=test");
    return false;
}
require('dotenv').config({path: `.env.${environment}`});

// 어제 날짜 받아오기 YYYYMMDD
const chkDate = getDate();
const apiKey = process.env.KEY_API;
const url = getAPIURL(chkDate, apiKey);

let data;
let seoul;
let total;

request({
  url,
  method: 'GET'
}, (error, response, body) => {
  if (response.statusCode === 200) {
    const parsedData = xml.parse(body);
    for (const node of parsedData[1].childNodes[1].childNodes[0].childNodes) {
      // TODO : 좀더 고도화 필요
      data = extractData(node, 'Seoul');
      if(Object.keys(data).length > 0) {
        seoul = data;
      }

      data = extractData(node, 'Total');
      if(Object.keys(data).length > 0) {
        total = data;
      }
    }
    console.log(seoul, total);

    const msg = `:mask: 어제 서울지역 확진자 ${seoul.incDec}명 (전국 ${total.incDec}명)`;
    console.log(`* environment: ${environment}\n* msg: ${msg}`);

    const headers = { 'Content-type': 'application/json' };
    const dataString = `{
      "blocks": [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "${msg}",
            "emoji": true
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": "가까운 선별진료소 및 검사 가능한 일반병원 찾아보기(링크 클릭 해주세요) <https://www.mohw.go.kr/react/popup_200128_3.html|선별진료소> / <https://www.mohw.go.kr/react/popup_200128.html|일반병원>"
            }
          ]
        }
      ]
    }`;

    const options = {
      url: `https://hooks.slack.com/services/${process.env.KEY_WEBHOOK}`,
      method: 'POST',
      headers,
      body: dataString
    };

    const callback = (error, response, body) => {
      if (!error && response.statusCode == 200) {
        console.log(body);
      }
      else {
        console.log('호출 에러!!!');
        console.log(response.statusCode);
        console.log(options);
      }
    }

    request(options, callback);
  }
});
