const xml2 = require('xml2js')


module.exports = async function getSummaryLoanInfo(file, nric, LoanId, ReqNo){
    var parser = new xml2.Parser();
    const today = new Date().toISOString();
    let res = await parser.parseStringPromise(file).then((result)=>{
        let summaryLoanInfo = result.Response.Report[0].Profile[0].LoanInfo[0].Summary[0]
        let approvedApp = summaryLoanInfo.ApprovedApp[0]
        let approvedApp_no = approvedApp.No[0]
        let approvedApp_totalAmount = approvedApp.TotalAmt[0].replace(/,/g, '')
        let pendingApp = summaryLoanInfo.PendingApp[0]
        let pendingApp_no = pendingApp.No[0]
        let pendingApp_TotalAmt = pendingApp.TotalAmt[0].replace(/,/g, '')
        let borrower = summaryLoanInfo.Borrower[0]
        let borrower_outstanding = borrower.Outstanding[0].replace(/,/g, '')
        let borrower_limit = borrower.Limit[0].replace(/,/g, '')
        let borrower_fec = borrower.Fec[0]
        let {Limit, Fec} = summaryLoanInfo.Guarantor[0]
        let total = summaryLoanInfo.Total[0]
        let total_limit = total.Limit[0].replace(/,/g, '')
        let total_fec = total.Fec[0]
        let arr = [nric, LoanId, approvedApp_no, approvedApp_totalAmount, pendingApp_no, pendingApp_TotalAmt, borrower_outstanding, borrower_limit, borrower_fec, Limit[0].replace(/,/g, ''), Fec[0], total_limit, total_fec, summaryLoanInfo.LegSts[0], summaryLoanInfo.SpecAttn[0], today, ReqNo]
        return arr
    })
    return res;
}