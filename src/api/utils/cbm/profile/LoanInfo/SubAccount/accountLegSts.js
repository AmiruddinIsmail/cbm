const xml2 = require("xml2js");

module.exports = async function accountLegSts(file, nric, ReqNo) {
  let arr = [];
  var parser = new xml2.Parser();
  const today = new Date().toISOString();
  let res = await parser.parseStringPromise(file).then((result) => {
    let legSts =
      result.Response.Report[0].Profile[0].LoanInfo[0].Accounts[0].Account;
    // let checkLegSts =
    //   result.Response.Report[0].Profile[0].LoanInfo[0].Accounts[0].Account
    //     .LegStsStdCode;

    if (!legSts[0].LegStsStdCode[0] || !legSts[0].LegSts) {
      return false;
    } else {
      for (let i = 0; i < legSts.length; i++) {
        if (!legSts[i].LegStsStdCode[0] || !legSts[i].LegSts) {
          console.log("not data at that particular file");
        } else {
          arr.push({
            nric,
            ReqNo,
            LegStsStdCode: legSts[i].LegStsStdCode[0],
            LegSts: legSts[i].LegSts[0],
            LegDate: legSts[i].LegDate[0]
              .replace(/[/]/g, "-")
              .split("-")
              .reverse()
              .join("-"),
            CreatedAt: today,
          });
        }
      }
      return arr;
    }
    // if (legSts) {
    //   for (let i = 0; i < legSts.length; i++) {
    //     arr.push({
    //       nric,
    //       ReqNo,
    //       LegStsStdCode: legSts[i].LegStsStdCode[0],
    //       LegSts: legSts[i].LegSts[0],
    //       LegDate: legSts[i].LegDate[0]
    //         .replace(/[/]/g, "-")
    //         .split("-")
    //         .reverse()
    //         .join("-"),
    //       CreatedAt: today,
    //     });
    //   }
    //   return arr;
    // } else {
    //   return false;
    // }
  });
  return res;
};
