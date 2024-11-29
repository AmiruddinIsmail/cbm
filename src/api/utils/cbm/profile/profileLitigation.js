const xml2 = require('xml2js')


module.exports = async function getProfileLitigation(file, nric, litigationId, ReqNo){
    var parser = new xml2.Parser();
    const today = new Date().toISOString();
    let res = await parser.parseStringPromise(file).then((result)=>{
        let litigation = result.Response.Report[0].Profile[0].Litigation[0]
        let obj = {}
        obj.NRIC = nric;
        obj.LitigationId = litigationId
        obj.Address = litigation.Address[0]
        obj.BankruptcyNotices = litigation.BankruptcyNotices[0]
        obj.Date = today,
        obj.ReqNo = ReqNo
        let arr = Object.values(obj)
        return arr
    })
    return res
}