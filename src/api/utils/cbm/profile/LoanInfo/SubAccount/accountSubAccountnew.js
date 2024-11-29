const xml2 = require("xml2js");
module.exports = async function accountSubAccountNew(file, nric, ReqNo) {
  let arr = [];
  var parser = new xml2.Parser();
  const today = new Date().toISOString();
  let res = await parser.parseStringPromise(file).then((result) => {
    let account =
      result.Response.Report[0].Profile[0].LoanInfo[0].Accounts[0].Account;
    if (account) {
      for (let i = 0; i < account.length; i++) {
        // console.log(account[i].SubAccs[0].SubAcc[0]);
        arr.push({
          nric,
          ReqNo,
          AccStsStdCode: account[i].SubAccs[0].SubAcc[0].AccStsStdCode[0],
          AccSts: account[i].SubAccs[0].SubAcc[0].AccSts[0],
          FacilityStdCode: account[i].SubAccs[0].SubAcc[0].FacilityStdCode[0],
          Facility: account[i].SubAccs[0].SubAcc[0].Facility[0],
          TotalOutstanding: account[i].SubAccs[0].SubAcc[0].TotalOutstanding
            ? account[i].SubAccs[0].SubAcc[0].TotalOutstanding[0].replace(
                ",",
                ""
              )
            : 0,
          CrPosDate: account[i].SubAccs[0].SubAcc[0].CrPosDate[0]
            .replace(/[/]/g, "-")
            .split("-")
            .reverse()
            .join("-"),
          RepayTermStdCode: account[i].SubAccs[0].SubAcc[0].RepayTermStdCode[0],
          RepayTerm: account[i].SubAccs[0].SubAcc[0].RepayTerm[0],
          InstlAmt: account[i].SubAccs[0].SubAcc[0].InstlAmt[0].replace(
            ",",
            ""
          ),
          ReschDat: account[i].SubAccs[0].SubAcc[0].ReschDat[0],
          RestrucDat: account[i].SubAccs[0].SubAcc[0].RestrucDat[0],
          CreatedAt: today,
        });
      }
      return arr;
    } else {
      // arr.push({
      //   nric,
      //   ReqNo,
      //   AccStsStdCode: "",
      //   AccSts: "",
      //   FacilityStdCode: "",
      //   Facility:,
      //   TotalOutstanding: 0,
      //   CrPosDate,
      //   RepayTermStdCode,
      //   RepayTerm,
      //   InstlAmt,
      //   ReschDat,
      //   RestrucDat,
      // });
      return false;
    }
  });
  return res;
};
