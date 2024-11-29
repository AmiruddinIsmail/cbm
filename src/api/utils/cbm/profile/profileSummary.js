const xml2 = require('xml2js')


module.exports = async function getProfileSummary(file, nric, SummaryId, ReqNo){
    var parser = new xml2.Parser();
    const today = new Date().toISOString();
    let res = await parser.parseStringPromise(file).then((result)=> {
        let summary = result.Response.Report[0].Profile[0].Summary[0]
        let dcheque = summary.DChequeSummary[0]
        let OthTotalNo = dcheque.OthTotalNo[0]
        let OwnTotalNo = dcheque.OwnTotalNo[0]
        let prev = summary.PrevEnqSummary[0]
        let TotaPrevEnqFI = prev.TotalPrevEnqFI[0]
        let TotalPrevEnqNonFI = prev.TotalPrevEnqNonFI[0]
        let CreatedAt = today
        let arr = [];
        arr.push(nric, SummaryId, OthTotalNo, OwnTotalNo, TotaPrevEnqFI, TotalPrevEnqNonFI, CreatedAt, ReqNo)
        return arr;
    })

    return res
}