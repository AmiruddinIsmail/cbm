const xml2 = require('xml2js')


module.exports = async function getProfileLoanInfo(file, nric, LoanId, ReqNo){
    var parser = new xml2.Parser();
    const today = new Date().toISOString();
    let res = await parser.parseStringPromise(file).then((result)=>{
        let loanInfo = result.Response.Report[0].Profile[0].LoanInfo[0]
        let obj = {}
        obj.NRIC = nric;
        obj.LoanId = LoanId
        obj.Warning = loanInfo.Warning[0]
        obj.SummaryId = 1
        obj.InstlYrId = 1
        obj.TotalBal = loanInfo.TotalBal[0].replace(/,/g, '')
        obj.TotalLimit = loanInfo.TotalLimit[0].replace(/,/g, '')
        obj.ApplicationsId = 1
        obj.SpecAttnAccs = ''
        obj.CreatedAt = today
        obj.ReqNo = ReqNo
        let arr = Object.values(obj)
        // console.log(arr);
        return {arr, LoanSummaryId: obj.SummaryId, InstlYrId: obj.InstlYrId, ApplicationId: obj.ApplicationsId, AccountId: 1}
    })
    return res
}