exports.genPlotly = (date) => {
  const fs = require('fs');
  const { getDate, getWeekIdx } = require('./lib');
  const plotly = require('plotly')(process.env.PLOTLY_ID, process.env.PLOTLY_KEY);

  const arrWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const arrTotal = [];
  const arrArea = [];
  const arrDate = [];

  for (let i = 6; i >= 0; i--) {
    const objDate = getDate(i);
    const idxDate = getWeekIdx(i);
    const fileWeeklyData = `./weeklyData/${arrWeek[idxDate]}`;

    const { data } = require(fileWeeklyData);
    arrDate.push(`${objDate.year}-${objDate.mon}-${objDate.day} 00:00:00`);
    arrTotal.push(data.total);
    arrArea.push(data.area);
  }

  // plotly data
  const data = [
    {
      line: {shape: "spline"},
      x: arrDate,
      y: arrTotal,
      type: "scatter",
      name: "Korea"
    },
    {
      line: {shape: "spline"},
      x: arrDate,
      y: arrArea,
      type: "scatter",
      name: "Seoul"
    },
  ];
  const layout = {width: 430, height: 150, margin: {l:30, r:0, t:0, b:42}};
  const graphOptions = {filename: "covid-19", fileopt: "overwrite", layout};

  return new Promise((resolve, reject) => {
    plotly.plot(data, graphOptions, function (err, msg) {
      if(typeof msg === 'undefined') {
        console.log(`* Plotly Error Message : ${err.body.message}`);
        reject(new Error('Grapch Generation Error!!!'));
      }

      const imgURL = `${msg.url}.png?_t=${(new Date()).valueOf()}`;
      console.log(`* Polyglot 이미지 URL : ${imgURL}`);
      const imgPath = 'covid-19-graph.png';

      const { downloadURL } = require('./lib');
      downloadURL(imgURL, imgPath)
      .then((imgPath) => {
        // upload to imgBB
        const fs = require('fs');
        const readFile = fs.readFileSync(imgPath); //이미지 파일 읽기
        const imgBinData = Buffer.from(readFile).toString('base64'); //파일 인코딩
        const options = {
          uri:'https://api.imgbb.com/1/upload',
          method: 'POST',
          form: {
            key: `${process.env.IMG_BB_API_KEY}`,
            image: imgBinData,
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
            const errTitle = 'File upload Error!!!';
            console.debug(`[${errTitle}] -------------------------------`);
            console.error(err);
            console.error(JSON.parse(body));
            reject(new Error(errTitle));
          }
        });
      }).catch(err => {
        console.error(err);
      });
    });
  });
};
