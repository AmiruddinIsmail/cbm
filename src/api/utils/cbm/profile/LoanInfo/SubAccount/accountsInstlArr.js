

module.exports = async function getSubAccountInstlArr(file, nric, instlArr, ReqNo){
       let arr = [], obj = {}; 
       const today = new Date().toISOString();
       if(instlArr[0] === 1){
        arr.push({
            NRIC: nric,
            InstlArrId: 1,
            M1: '',
            M2: '',
            M3: '',
            M4: '',
            M5: '',
            M6: '',
            M7: '',
            M8: '',
            M9: '',
            M10: '',
            M11: '',
            M12: '',
            CreatedAt: today,
            ReqNo
        })
       }else{
        for(let i = 0; i < instlArr.length; i++){
            arr.push({
                NRIC: nric,
                InstlArrId: i+1,
                M1: instlArr[i].M1[0],
                M2: instlArr[i].M2[0],
                M3: instlArr[i].M3[0],
                M4: instlArr[i].M4[0],
                M5: instlArr[i].M5[0],
                M6: instlArr[i].M6[0],
                M7: instlArr[i].M7[0],
                M8: instlArr[i].M8[0],
                M9: instlArr[i].M9[0],
                M10: instlArr[i].M10[0],
                M11: instlArr[i].M11[0],
                M12: instlArr[i].M12[0],
                CreatedAt: today,
                ReqNo
            })
        }
       }
       
        return arr
    
}