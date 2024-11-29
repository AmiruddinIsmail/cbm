const xml2 = require('xml2js')


module.exports = async function getProfileScoring(file, nric, scoringID, ReqNo){
    var parser = new xml2.Parser();
    const today = new Date().toISOString();
    let res = await parser.parseStringPromise(file).then((result)=>{
        let {Grade, Score, PD} = result.Response.Report[0].Profile[0].Scoring[0]
        let arr = []
        arr.push(nric, scoringID, Grade[0], Score[0], PD[0], today, ReqNo)
        return arr
    })
    return res
}