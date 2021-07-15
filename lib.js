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

// 요일 인덱스값 가져오기 Sunday - Saturday : 0 - 6
exports.getWeekIdx = minDay => {
  const date = new Date();
  if(minDay > 0) {
    date.setDate(date.getDate() - minDay);
  }

  return date.getDay();
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

// weekly데이타 저장
exports.writeWeeklyData = ({ area, total }) => {
  const arrWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const fs = require('fs');
  const path = `./weeklyData/${arrWeek[this.getWeekIdx(0)]}.js`;
  const objCnt = {
    total: parseInt(total.localOccCnt, 10) + parseInt(total.overFlowCnt, 10),
    area: parseInt(area.localOccCnt, 10) + parseInt(area.overFlowCnt, 10),
    death: total.deathCnt
  };
  const data = `exports.data = {total: ${objCnt.total}, area: ${objCnt.area}, death: ${objCnt.death}};\n`;

  fs.writeFileSync(path, data, err => {
    if (err === null) {
      console.log(`* 요일 데이타 저장 성공 : ${data}`);
    } else {
      console.error(`* 요일 데이타 저장 성공 : ${data}`);
    }
  });
};

// 정부 또는 슬랙 API URL 리턴
exports.getAPIURL = (opt, date) => {
  let url;

  if (opt === 'gov') {
    const chkDate = `${date.year}${date.mon}${date.day}`;
    url = 'http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19SidoInfStateJson';
    url += `?ServiceKey=${process.env.DATA_API_KEY}&ServiceKey=-&pageNo=1`;
    url += `&numOfRows=10&startCreateDt=${chkDate}&endCreateDt=${chkDate}`;
  }
  else if (opt === 'slack') {
    url =  `https://hooks.slack.com/services/${process.env.SLACK_WEBHOOK_KEY}`;
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

exports.addComma = num => {
  if (typeof num !== 'number') {
    num = parseInt(num, 10);
  }

  return num.toLocaleString('en-US')
};

// 슬랙 메시지 제작
exports.genSlackMsg = ({ area, total, date, img, news }) => {
  const objCnt = {
    total: parseInt(total.localOccCnt, 10) + parseInt(total.overFlowCnt, 10),
    area: parseInt(area.localOccCnt, 10) + parseInt(area.overFlowCnt, 10)
  };
  let msg = `:mask: ${area.gubun} 지역 추가 확진자 ${this.addComma(objCnt.area)}명, 전국 ${this.addComma(objCnt.total)}명 `;
  msg += `(${date.mon}월 ${date.day}일 00시 기준)`;
  console.log(`* Slack Message: ${msg}`);
  let newsList = '';
  for(item of news) {
    newsList += `• <${item.link}|${item.title}>`;
    newsList += '\n';
  }

  const unixTime = (new Date()).valueOf();
  const rateDeath = ((total.plusDeathCnt*100)/objCnt.total).toFixed(3);
  return `{
    "blocks": [
      {
        "type": "image",
        "title": {
          "type": "plain_text",
          "text": "일별 확진자 발생 추이",
          "emoji": true
        },
        "image_url": "${img.url}?_t=${unixTime}",
        "alt_text": "일별 확진자 발생 추이 그래프"
      },
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
        "text": {
          "type": "mrkdwn",
          "text": ":br: 누적 사망자 ${this.addComma(total.deathCnt)}명 (추가 ${this.addComma(total.plusDeathCnt)}명, 전일 사망율 : ${rateDeath}%) <https://coronaboard.kr/|실시간 상황판>"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "가까운 선별진료소 및 검사 가능한 일반병원 찾아보기 (링크를 클릭하세요)\n<https://www.mohw.go.kr/react/popup_200128_3.html|선별진료소> / <https://www.mohw.go.kr/react/popup_200128.html|일반병원>"
        }
      },
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": ":newspaper: 관련 뉴스",
          "emoji": true
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "${newsList}"
        }
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "더보기",
              "emoji": true
            },
            "url": "${process.env.GOOGLE_NEWS_URL}",
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

exports.getGoogleNews = async (cntItem = 3) => {
  let Parser = require('rss-parser');
  let parser = new Parser();
  const arrNews = [];

  const urlRSSFeed = process.env.GOOGLE_NEWS_FEED;
  let feed = await parser.parseURL(urlRSSFeed);

  let chkCntItem = 0;
  const lenTitle = 45;
  for (let i = 0; i < cntItem; i++) {
    const item = feed.items[i];
    let title = item.title.replace(/\"/g, '\\"').replace(/ - [^-]+$/, '')
      .replace(/\s[<\-\|:]\s.+$/, '')  // ' - 한국어 방송' 같은 문구 제거
      .trim();
      //.replace(/<\/?b>/ig, '')
      //.replace(/&#39;/g, '\'')
      //.replace('...', '');
    if(title.length > lenTitle) {
      title = title.substring(0, lenTitle).trim().replace(/(?:…|\.+)$/, '').trim() + '…';
    }
    const link = item.link;
    //decodeURIComponent(item.link.replace(/^http.+url=/, '').replace(/&ct=.+$/, ''));

    arrNews.push({title, link});
  }
  console.debug(arrNews);
  return arrNews;
}
