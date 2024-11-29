const xml2 = require("xml2js");

module.exports = async function specAttnAcs(file, nric, ReqNo) {
  let arr = [];
  var parser = new xml2.Parser();
  const today = new Date().toISOString();
  let res = await parser.parseStringPromise(file).then((result) => {
    let specAttnAcs =
      result.Response.Report[0].Profile[0].LoanInfo[0].SpecAttnAccs[0]
        .SpecAttnAcc;

    if (specAttnAcs) {
      for (let i = 0; i < specAttnAcs.length; i++) {
        if (
          !specAttnAcs[i].FacilityStdCode[0] ||
          !specAttnAcs[i].LenderType[0]
        ) {
          return false;
        } else {
          arr.push({
            nric,
            ApprovedDate: specAttnAcs[i].ApprovedDate[0]
              .replace(/[/]/g, "-")
              .split("-")
              .reverse()
              .join("-"),
            Capacity: specAttnAcs[i].Capacity[0],
            LenderType: specAttnAcs[i].LenderType[0],
            AccStsStdCode: specAttnAcs[i].AccStsStdCode[0],
            AccSts: specAttnAcs[i].AccSts[0],
            FacilityStdCode: specAttnAcs[i].FacilityStdCode[0],
            Facility: specAttnAcs[i].Facility[0],
            CrPosDate: specAttnAcs[i].CrPosDate[0]
              .replace(/[/]/g, "-")
              .split("-")
              .reverse()
              .join("-"),
            LegStsStdCode: specAttnAcs[i].LegStsStdCode[0],
            LegSts: specAttnAcs[i].LegSts[0],
            LegDate: specAttnAcs[i].LegDate[0]
              .replace(/[/]/g, "-")
              .split("-")
              .reverse()
              .join("-"),
            CreatedAt: today,
            ReqNo,
          });
        }
      }

      return arr;
    } else {
      arr.push({
        nric,
        ApprovedDate: "",
        Capacity: "",
        LenderType: "",
        AccStsStdCode: "",
        AccSts: "",
        FacilityStdCode: "",
        Facility: "",
        CrPosDate: "",
        LegStsStdCode: "",
        LegSts: "",
        LegDate: "",
        CreatedAt: today,
        ReqNo,
      });
      return false;
    }
  });
  return res;
};
