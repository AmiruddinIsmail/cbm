const xml2 = require("xml2js");

module.exports = async function getInstlYrTradeReference(
  file,
  nric,
  instlId,
  reqNo
) {
  var parser = new xml2.Parser();
  const today = new Date().toISOString();
  let date = [],
    ReqNo = [];
  let res = await parser.parseStringPromise(file).then((result) => {
    let instlYr =
      result.Response.Report[0].Profile[0].TradeReference[0].InstlYr[0];
    let instlMth =
      result.Response.Report[0].Profile[0].TradeReference[0].InstlMth[0];
    let { Y1, Y2 } = instlYr;
    date.push(today);
    let instlYrarr = [];
    ReqNo.push(reqNo);
    instlYrarr.push(nric, instlId, Y1[0], Y2[0]);
    // console.log(instlMth);
    let arr = [];
    for (var i in instlMth) arr.push(instlMth[i][0]);

    let realarr = instlYrarr.concat(arr, date, ReqNo);
    return realarr;
  });
  return res;
};
