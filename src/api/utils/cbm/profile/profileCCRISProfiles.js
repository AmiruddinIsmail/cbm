const xml2 = require('xml2js')


module.exports = async function getProfileSummary(file, nric, CCRISId){
    var parser = new xml2.Parser();
    const today = new Date().toISOString();
    let res = await parser.parseStringPromise(file).then((result)=> {
        let ccrisProfiles = result.Response.Report[0].Profile[0].CCRISProfiles
        let obj = {};
            obj.CCRISProfilesID = CCRISId;
            obj.NRIC = nric
            obj.Name = '';
            obj.IDNo1 = '';
            obj.IdNo2 = '';
            obj.DateBR = '';
            obj.Group = '';
            obj.Nationality = '';
            obj.Registered = '';
            obj.EntKey = ''
            obj.CreatedAt = today
            let arr = Object.values(obj);
            // console.log(arr);
            return arr
    })
    return res
}