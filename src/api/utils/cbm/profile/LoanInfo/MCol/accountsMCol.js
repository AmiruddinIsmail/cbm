const xml2 = require('xml2js')


module.exports = async function getMcolAccount(file, nric, mcol, ReqNo){
    let arr = []
    const today = new Date().toISOString();
    if(mcol[0] === 1){
        arr.push({
            nric,
            AccountsId: 1,
            MColTypStdCode: '',
            MColTyp: '',
            MColVal: 0,
            CreatedAt: today,
            ReqNo
        })
    }else{
        for(let i = 0; i < mcol.length; i ++){
            let value = mcol[i].MCol[0]
            arr.push({
                nric,
                AccountsId: i+1,
                MColTypStdCode: value.MColTypStdCode[0],
                MColTyp: value.MColTyp[0],
                MColVal: value.MColVal[0],
                CreatedAt: today,
                ReqNo
            })
        }
    }
    return arr;
}