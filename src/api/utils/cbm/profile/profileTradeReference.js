const xml2 = require('xml2js')


module.exports = async function getApplicationLoanInfo(file, nric, tradeReferenceId, ReqNo){
    var parser = new xml2.Parser();
    let res = await parser.parseStringPromise(file).then((result)=>{
        let tradeRef = result.Response.Report[0].Profile[0].TradeReference[0]
        let obj = {}
        const today = new Date().toISOString();
        // obj.tradeReferenceId = tradeReferenceId
        obj.NRIC = nric
        obj.InstlYrId = 1
        obj.TotalBal = tradeRef.TotalBal[0]
        obj.TotalLimit = tradeRef.TotalLimit[0]
        obj.IndustriesId = 1
        obj.CreatedAt = today,
        obj.ReqNo = ReqNo
        let arr = Object.values(obj)

        return {arr, tradeReferenceId: 1}
    })
    return res
}