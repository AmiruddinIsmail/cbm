
module.exports = async function getSubAccScols(file, nric, scols, ReqNo){
    let arr = []  
    const today = new Date().toISOString();
    if(scols[0] === 1){
        arr.push({
            NRIC: nric,
            SColsID : 1,
            SColTypStdCode: '',
            SColTyp: '',
            SColVal: '',
            CreatedAt: today,
            ReqNo
        })
    }else{
        for(let i = 0; i < scols.length; i ++){
            let item = scols[i].SCol[0]
            arr.push({
                NRIC: nric,
                SColsID : i + 1,
                SColTypStdCode: item.SColTypStdCode[0],
                SColTyp: item.SColTyp[0],
                SColVal: item.SColVal[0].replace(/,/g, ''),
                CreatedAt: today,
                ReqNo
            })
        }  
    }
    
    return arr
}