const xml2 = require('xml2js')

module.exports = async function getProfile(file, nric, ReqNo){
    var parser = new xml2.Parser();
    let res = await parser.parseStringPromise(file).then((result)=> {
        let key = result.Response.Report[0].Profile[0]
        const today = new Date().toISOString();
        let obj = {}
        obj.Name = key.Name[0],
        obj.IdNo = key.IdNo[0]
        obj.IdNo2 = key.IdNo2[0]
        obj.Dob = key.Dob[0]
        obj.ConstitutionTypeStdCode = key.ConstitutionTypeStdCode[0]
        obj.ConstitutionType = key.ConstitutionType[0]
        obj.Nationality = key.Nationality[0]
        obj.NationalityStdCode = key.NationalityStdCode[0]
        obj.ResidencyDesc = key.ResidencyDesc[0]
        obj.CCRISProfilesID = 1
        obj.SummaryID = 1
        obj.LoanInfoID = 1
        obj.ScoringID = 1
        obj.TradeReferenceID = 1
        obj.LitigationID = 1
        obj.CreatedAt = today
        obj.ReqNo = ReqNo
        let arr = Object.values(obj)
        return {arr, SummaryID: obj.SummaryID, CCRISProfilesId: obj.CCRISProfilesID, LoanInfoId: obj.LoanInfoID, ScoringId: obj.ScoringID, TradeReferenceId: obj.TradeReferenceID, LitigationId: obj.LitigationID}
            
    })

    return res
}