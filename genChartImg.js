exports.genChartImg = (date) => {
  const fs = require('fs');
  const { getDate, getWeekIdx } = require('./lib');
  const ChartJSImage = require('chart.js-image');

  const arrWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const arrTotal = [];
  const arrArea = [];
  const arrDate = [];

  for (let i = 6; i >= 0; i--) {
    const objDate = getDate(i);
    const idxDate = getWeekIdx(i);
    const fileWeeklyData = `./weeklyData/${arrWeek[idxDate]}`;

    const { data } = require(fileWeeklyData);
    arrDate.push(`${objDate.mon}/${objDate.day}`);
    arrTotal.push(data.total);
    arrArea.push(data.area);
  }

  // Chart data
  const data = {
    "type": "line",
    "data": {
      "labels": arrDate,
      "datasets": [
        {
          "label": "Korea",
          "borderColor": "rgb(255,+99,+132)",
          "backgroundColor": "rgba(255,+99,+132,+.5)",
          "data": arrTotal
        },
        {
          "label": "Seoul",
          "borderColor": "rgb(54,+162,+235)",
          "backgroundColor": "rgba(54,+162,+235,+.5)",
          "data": arrArea
        }
      ]
    }
  };

  const layout = {width: 430, height: 150, margin: {l:30, r:0, t:0, b:42}};
  const graphOptions = {filename: "covid-19", fileopt: "overwrite", layout};

  return new Promise((resolve, reject) => {
    const chart = ChartJSImage().chart(data)
      .backgroundColor('white')
      .width(400) // 500px
      .height(200);

    const img_url = chart.toURL();
    console.log(`* Chart Image URL : ${img_url}`);

    // upload to imgBB
    const options = {
      uri:'https://api.imgbb.com/1/upload',
      method: 'POST',
      form: {
        key: `${process.env.IMG_BB_API_KEY}`,
        image: img_url,
        name: `covid-19-${date.year}-${date.mon}-${date.day}.png`
      }
    };

    const request = require('request');
    request.post(options, function(err, httpResponse, body){
      if (httpResponse.statusCode === 200) {
        const objData = JSON.parse(body).data;
        console.log(`* imgBB 이미지 URL : ${objData.url}`);
        resolve(objData.url);
      } else {
        reject(new Error('File upload Error!!!'));
      }
    });
  });
};
