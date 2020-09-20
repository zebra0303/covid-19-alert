
exports.genPlotly = () => {
  const fs = require('fs');
  const { getDate, getWeekyIdx } = require('./lib');
  const plotly = require('plotly')(process.env.PLOTLY_ID, process.env.PLOTLY_KEY);

  const arrWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const arrTotal = [];
  const arrArea = [];
  const arrDate = [];

  for (let i = 6; i >= 0; i--) {
    const objDate = getDate(i);
    const idxDate = getWeekyIdx(i);
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
      const img_url = `${msg.url}.png`;
      console.log(`* Polyglot 이미지 URL : ${img_url}`);
      resolve(img_url);
    });
  });
};
