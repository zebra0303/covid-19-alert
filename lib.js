// 날짜 정보 가져오기 YYYYMMDD
exports.getDate = minDay => {
  const date = new Date();
  if(minDay > 0) {
    date.setDate(date.getDate() - minDay);
  }
  const yyyy = String(date.getFullYear());
  const mm = String(1 + date.getMonth()).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0');

  return { 'year': yyyy, 'mon': mm, 'day': dd};
};

// 로그 데이타 읽기
exports.readDateLog = logFile => {
  const fs = require('fs');
  if (fs.existsSync(logFile)) {
    return fs.readFileSync(logFile, 'utf8');
  }
  else {
    return '12251225';
  }
}

// 로그 데이타 저장
exports.writeDateLog = (logFile, date) => {
  const fs = require('fs');
  const logData = `${date.year}${date.mon}${date.day}`;

  fs.writeFile(logFile, logData, err => {
    if (err === null) {
      console.log(`* 로그 저장 성공 : ${logData}`);
    } else {
      console.error(`* 로그 저장 실패 : ${logData}`);
    }
  });
};

// 정부 또는 슬랙 API URL 리턴
exports.getAPIURL = (opt, date) => {
  let url;

  if (opt === 'gov') {
    const chkDate = `${date.year}${date.mon}${date.day}`;
    url = 'http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19SidoInfStateJson';
    url += `?ServiceKey=${process.env.KEY_API}&ServiceKey=-&pageNo=1`;
    url += `&numOfRows=10&startCreateDt=${chkDate}&endCreateDt=${chkDate}`;
  }
  else if (opt === 'slack') {
    url =  `https://hooks.slack.com/services/${process.env.KEY_WEBHOOK}`;
  }

  return url;
};

// XML 데이타 중 필요한 아이템 추출
exports.extractData = (node, code) => {
  const data = {};

  if (node.childNodes.find(elem => elem.innerXML === code)) {
    for (const item of node.childNodes) {
      data[item.tagName] = item.innerXML;
    }
  }

  return data;
};

// 터미널 플래그 값 리턴
exports.parseCliFlagValue = flagName => {
  const flag = process.argv
    .find(argument => argument.indexOf(`--${flagName}=`) > -1);

  if (flag) {
      return flag.slice(flag.indexOf('=') + 1);
  }

  return undefined;
};

// 슬랙 메시지 제작
exports.genSlackMsg = ({ area, total, date }) => {
  console.log(date);
  let msg = `:mask: ${area.gubun} 지역 추가 확진자 ${area.incDec}명, 전국 ${total.incDec}명 `;
  msg += `(${date.mon}월 ${date.day}일 00시 기준)`;
  console.log(`* Slack Message: ${msg}`);

  return `{
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
};

exports.showError = (response, options) => {
  console.error('호출 에러!!!');
  console.error(response.statusCode);
  console.error(options);
};
