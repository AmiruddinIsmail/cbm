const xml2 = require('xml2js')


module.exports = async function getIndustryTradeReference(file, nric, tradeReferenceId, ReqNo){
    var parser = new xml2.Parser();
    const today = new Date().toISOString();
    let arr = [], creditor = []
    let res = await parser.parseStringPromise(file).then((result)=>{
        let industry = result.Response.Report[0].Profile[0].TradeReference[0].Industries[0].Industry
        for(let i = 0; i < industry.length; i++){
            let item = industry[i]
            creditor.push(item.Creditors[0])
            arr.push({
                NRIC: nric,
                tradeReferenceId,
                IndustryCode: item.IndustryCode[0],
                IndustryDesc: item.IndustryDesc[0],
                CreditorsId: i+1,
                CreatedAt: today,
                ReqNo
            })
        }
        return {arr, creditor}
    })
    return res
}