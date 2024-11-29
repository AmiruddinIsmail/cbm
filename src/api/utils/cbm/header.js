const xml2 = require("xml2js");

module.exports = async function getHeader(file, nric, ReqNo) {
  var parser = new xml2.Parser();
  const today = new Date().toISOString();
  let obj = {};
  let res = await parser.parseStringPromise(file).then((result) => {
    let key = result.Response;
    delete key.Subjects;
    delete key.Report;
    key.NRIC = [nric];
    (obj.NRIC = nric), (obj.SystemID = key.SystemID[0].toString());
    obj.Service = key.Service[0].toString();
    obj.ReportType = key.ReportType[0].toString();
    obj.ReportTitle = key.ReportTitle[0].toString();
    obj.MemberID = key.MemberID[0];
    obj.UserID = key.UserID[0];
    obj.ReqNo = key.ReqNo[0];
    obj.SequenceNo = key.SequenceNo[0];
    obj.ReqDate = key.ReqDate[0].toString();
    obj.PurposeStdCode = key.PurposeStdCode[0].toString();
    obj.Purpose = key.Purpose[0].toString();
    obj.CostCenterStdCode = key.CostCenterStdCode
      ? key.CostCenterStdCode[0].toString()
      : "";
    obj.CostCenter = key.CostCenter[0].toString();
    obj.TradeAvailable = key.TradeAvailable[0].toString();
    obj.ResponseDate = key.ResponseDate[0].toString();
    obj.Warning = key.Warning[0].toString();
    (obj.Errors = key.Errors[0].toString()), (obj.CreatedAt = today);
    let arr = Object.values(obj);
    return arr;
  });
  return res;
};
