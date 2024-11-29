module.exports = async function getCreditorIndustry(file, nric, creditor, ReqNo){
    let arr = [], account = [];
    const today = new Date().toISOString();

    for(let i = 0; i < creditor.length; i ++){
        let item = creditor[i].Creditor[0]

        account.push(item.Accounts[0])
        arr.push({
            NRIC: nric,
            IndustryID: i+1,
            RegNo: item.RegNo[0],
            NewRegNo: item.NewRegNo[0],
            Address: item.Address[0],
            ContactNo: item.ContactNo[0],
            AccountId: i+1,
            CreatedAt: today, 
            ReqNo
        })
    }
    return{arr, account}

}