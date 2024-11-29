module.exports = async function getAccountCreditor(file, nric, account, ReqNo){
    let arr = []
    const today = new Date().toISOString();
    for(let i = 0; i < account.length; i++){
        let item = account[i].Account[0]
        arr.push({
            NRIC: nric,
            creditorId: i+1,
            No: item.No[0],
            StartDate: item.StartDate[0],
            AccStsCode: item.AccStsCode[0],
            CapacityCode: item.CapacityCode[0],
            Capacity: item.Capacity[0],
            NatureOfDebtCode: item.NatureOfDebtCode[0],
            NatureOfDebt: item.NatureOfDebt[0],
            RefNo: item.RefNo[0],
            SubAccs: 1,
            CreatedAt: today,
            ReqNo
        })
    }
    return arr
}