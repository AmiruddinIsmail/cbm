
module.exports = async function getSubAccountAccounts(file, nric, subAcc, ReqNo){
        let arr = [], scol = [], instlArr = []
        const today = new Date().toISOString();
        if(subAcc[0] === 1){
            scol.push(1)
            instlArr.push(1)
            arr.push({
                nric,
                AccountId: 1,
                AccStsStdCode: '',
                AccSts: '',
                FacilityStdCode: '',
                Facility: '',
                TotalOutstanding: 0,
                CrPosDate: '',
                RepayTermStdCode: '',
                RepayTerm: '',
                InstlAmt: 0,
                ReschDat: '',
                RestrucDat: '',
                ScolsId: 1,
                InstlArr: 1,
                CreatedAt: today, 
                ReqNo
            })
        }else{
            for(let i = 0; i < subAcc.length; i++){
                let item = subAcc[i].SubAcc[0]
                scol.push(item.SCols[0])
                instlArr.push(item.InstlArr[0])
                arr.push({
                    nric,
                    AccountId: i+1,
                    AccStsStdCode: item.AccStsStdCode[0],
                    AccSts: item.AccSts[0],
                    FacilityStdCode: item.FacilityStdCode[0],
                    Facility: item.Facility[0],
                    TotalOutstanding: item.TotalOutstanding[0].replace(/,/g, ''),
                    CrPosDate: item.CrPosDate[0].replace(/[/]/g, '-').split('-').reverse().join('-'),
                    RepayTermStdCode: item.RepayTermStdCode[0],
                    RepayTerm: item.RepayTerm[0],
                    InstlAmt: item.InstlAmt[0].replace(/,/g, ''),
                    ReschDat: item.ReschDat[0],
                    RestrucDat: item.RestrucDat[0],
                    ScolsId: i+1,
                    InstlArr: i+1,
                    CreatedAt: today, 
                    ReqNo
                })
                }  
        }
     
        return {arr, scol, instlArr}
}