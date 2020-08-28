exports.getDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const yyyy = date.getFullYear();
  let mm = 1 + date.getMonth();
  let dd = date.getDate();

  if (mm < 10) {
    mm = '0' + mm;
  }


  if (dd < 10) {
    dd = '0' + dd;
  }

  return `${yyyy}${mm}${dd}`
};

exports.getAPIURL = (chkDate, apiKey) => {
  console.log(apiKey);
  const url = 'http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19SidoInfStateJson';
  let queryParams = '?' + encodeURIComponent('ServiceKey') + '=' + apiKey; /* Service Key*/
  queryParams += '&' + encodeURIComponent('ServiceKey') + '=' + encodeURIComponent('-'); /* */
  queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* */
  queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('10'); /* */
  queryParams += '&' + encodeURIComponent('startCreateDt') + '=' + encodeURIComponent(chkDate); /* */
  queryParams += '&' + encodeURIComponent('endCreateDt') + '=' + encodeURIComponent(chkDate); /* */

  return url + queryParams;
};

exports.extractData = (node, name) => {
  const data = {};

  if (node.childNodes.find(elem => elem.innerXML === name)) {
    for (const item of node.childNodes) {
      data[item.tagName] = item.innerXML;
    }
  }

  return data;
};


exports.parseCliFlagValue = flagName => {
  const flag = process.argv.find(argument => argument.indexOf(`-${flagName}=`) > -1);

  if (flag) {
      return flag.slice(flag.indexOf('=') + 1);
  }

  return undefined;
};
