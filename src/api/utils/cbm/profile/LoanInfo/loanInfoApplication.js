const xml2 = require("xml2js");
const moment = require("moment");

module.exports = async function getApplicationLoanInfo(
  file,
  nric,
  applicationId,
  reqNo
) {
  var parser = new xml2.Parser();
  const today = new Date().toISOString();
  let appli,
    data = [];
  let res = await parser.parseStringPromise(file).then((result) => {
    // let appli = result.Response.Report[0].Profile[0].LoanInfo[0].Applications[0].Application

    appli = result.Response.Report[0].Profile[0].LoanInfo[0]?.Applications;
    if (!appli || appli[0] === "") {
      let arr;
      arr = [];
      arr.push(
        nric,
        applicationId,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        today,
        reqNo
      );
      data.push(arr);
    } else {
      appli =
        result.Response.Report[0].Profile[0].LoanInfo[0].Applications[0]
          .Application;
      console.log(appli);
      let arr;
      for (let i = 0; i < appli.length; i++) {
        arr = [];
        let item = appli[i];
        let date = item.Date[0]
          .replace(/[/]/g, "-")
          .split("-")
          .reverse()
          .join("-");
        arr.push(
          nric,
          applicationId,
          item.No[0],
          date,
          item.AppTyp ? item.AppTyp[0] : "",
          item.StsStdCode[0],
          item.Sts[0],
          item.Capacity[0],
          item.LenderType[0],
          item.AmtAppl[0].replace(/,/g, ""),
          item.MyFgn[0],
          item.Facility[0],
          today,
          reqNo
        );
        data.push(arr);
      }
    }
    return data;
  });
  return res;
};
