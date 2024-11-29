const connection = require('../middlewares/db')

module.exports = async function insertSP(nric, orderID, ReqNo){

  const today = new Date().toISOString();
//   let insertCM_CompAsia = `INSERT INTO credit_model.CM_CompAsia (NRIC, OrderID, Loan_Application_Date, gendercodename, age, monthly_income, no_of_facility, net_salary) VALUES ('${nric}', '${orderID}', '${today}', ${gendercodename}, ${age}, ${monthly_income}, 1, 0.00)`

//   const itemInsertCM = await connection.query(insertCM_CompAsia)

//   console.log('itemInsertCM', itemInsertCM);
    
  let sqlCreditModeller = `CALL credit_model.SP_CM_Credit_Model('${nric}','${orderID}','${ReqNo}');call credit_model.sp_CM_Final ('${nric}','${orderID}', @Final);SELECT @FINAL`

  let result = await connection.getall(sqlCreditModeller)
  console.log(result);
  let item = Object.values(result[2][0])
  if(item[0] == 1){
    return {
      status: 'approved'
    }
  }else if (item[0] == 0){
   return {
      status: 'failed'
   }
  }else {
    return{
        status: 'Please Check Something Wrong'
    }
  }
}