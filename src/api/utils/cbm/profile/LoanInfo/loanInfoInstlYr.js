const xml2 = require('xml2js')


module.exports = async function getInstlYrLoanInfo(file, nric, instlId, reqNo){
    var parser = new xml2.Parser();
    const today = new Date().toISOString();

    let res = await parser.parseStringPromise(file).then((result)=>{
        let instlYr = result.Response.Report[0].Profile[0].LoanInfo[0].InstlYr[0]
        let instlMth = result.Response.Report[0].Profile[0].LoanInfo[0].InstlMth[0]
        let {Y1, Y2} = instlYr
        let instlYrarr = []
        let date = []
        let ReqNo = []
        ReqNo.push(reqNo)
        date.push(today)
        instlYrarr.push(nric, instlId, Y1[0], Y2[0])
        // console.log(instlMth);
        let arr = []
        for(var i in instlMth)
            arr.push(instlMth[i][0])

        let realarr = instlYrarr.concat(arr,date,ReqNo)
        return realarr
    })
    return res
}