const xml2 = require("xml2js");
const moment = require("moment");

module.exports = async function getAccountsLoanInfo(
  file,
  nric,
  accountId,
  ReqNo
) {
  var parser = new xml2.Parser();
  const today = new Date().toISOString();
  let res = await parser.parseStringPromise(file).then((result) => {
    // let account = result.Response.Report[0].Profile[0].LoanInfo[0].Accounts[0].Account
    let account = result.Response.Report[0].Profile[0].LoanInfo[0].Accounts;
    let arr = [],
      data,
      id = [],
      subAcc = [],
      mcol = [];

    if (account[0] === "") {
      data = [];
      mcol.push(1);
      id.push(1);
      subAcc.push(1);
      data.push(
        nric,
        accountId,
        "",
        "",
        "",
        "",
        0,
        "",
        "",
        "",
        "",
        0,
        0,
        "",
        ReqNo
      );
      arr.push(data);
    } else {
      let account =
        result.Response.Report[0].Profile[0].LoanInfo[0].Accounts[0].Account;
      for (let i = 0; i < account.length; i++) {
        data = [];
        let item = account[i];
        mcol.push(item.MCols[0]);
        subAcc.push(item.SubAccs[0]);
        id.push(i + 1);
        let result = item.ApprovedDate[0]
          .replace(/[/]/g, "-")
          .split("-")
          .reverse()
          .join("-");
        data.push(
          nric,
          accountId,
          item.No[0],
          result,
          item.Capacity[0],
          item.LenderType ? item.LenderType[0] : "",
          item.Limit[0].replace(/,/g, ""),
          item.LegSts[0],
          item.LegStsStdCode[0],
          item.LegDate[0],
          item.MyFgn[0],
          i + 1,
          i + 1,
          today,
          ReqNo
        );
        arr.push(data);
      }
    }
    return { arr, id, subAcc, mcol };
  });
  return res;
};
