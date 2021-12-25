// 확진자 통계를 가져올 지역 명 (Seoul 또는  서울)
const areaCode = 'Seoul';

// 오늘 기준 차감 일 - API업데이트가 늦어지면 -1 씩 차감
let minDay = 0;
const request = require('request');
const xml = require('xml-parse');
const { getAPIURL, extractData, genSlackMsg, getDate, getWeekIdx,
  parseCliFlagValue, showError, readDateLog, writeWeeklyData,
  writeDateLog, getGoogleNews } = require('./lib');
//const { genPlotly } = require('./genPlotly');
const { genChartImg } = require('./genChartImg');

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
const callWebhook = async (data) => {
  console.log(`* Environment: ${environment}`);

  // 구글 뉴스 불러오기
  data.news = await getGoogleNews();

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

  // 이미 보낸 슬랙 웹훅인지 체킹
  const numLogDate = Number(readDateLog(logFile));
  const numChkDate = Number(`${date.year}${date.mon}${date.day}`);
  //console.log(numChkDate > numLogDate, numChkDate, numLogDate);
  if (numChkDate <= numLogDate) {
    console.log(`* Skipped!!! 해당 날짜의 정보는 이미 전송었습니다! 체크날짜(${numChkDate}) <= 로그날짜(${numLogDate})`);

    return false;
  }

  const url = getAPIURL('gov', date);
  const options = { url, method: 'GET' };

  const callback = async (error, response, body) => {
    let dataTemp, dataArea, dataTotal;

    if (!error && response.statusCode === 200) {
      const parsedData = xml.parse(body);

    if (typeof parsedData[1].childNodes[1].childNodes === 'undefined') {
      console.error("XML 데이타 오류!!!\n");
      console.error(`* 호출 URL : ${url}\n`);
      console.error(parsedData);

      return false;
    }


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

      // 추가 사망자 계산
      const arrWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const yesterdayWeekIdx = getWeekIdx(1);
      const fileWeeklyData = `./weeklyData/${arrWeek[yesterdayWeekIdx]}`;
      const { 'data' : yesterdayData} = require(fileWeeklyData);
      if (typeof yesterdayData.death === 'undefined') {
        yesterdayData.death = 0;
      }

      dataTotal.plusDeathCnt = dataTotal.deathCnt - yesterdayData.death;

      console.log(dataArea, dataTotal);
      // weeklyData 저장  후 그래프 이미지 생성
      writeWeeklyData({ area: dataArea, total: dataTotal});
      //const chartImgURL = await genPlotly(date);
      const chartImgURL = await genChartImg(date);

      callWebhook({ area: dataArea, total: dataTotal, date, img: {url: chartImgURL} });
    }
    else {
      showError(response, options);
    }
  };

  request(options, callback);
};

callAPI(areaCode);
