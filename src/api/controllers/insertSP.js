const connection = require("../middlewares/db");

/**
 * @returns {Promise<{status: "approved" | "failed" | "already exists"}>}
 */
module.exports = async function insertSP(
  nric,
  orderID,
  ReqNo,
  gendercodename,
  age,
  monthly_income,
  nett_salary,
  device_montly_payment,
  Tenure,
  no_of_facility
) {
  const today = new Date().toISOString();
  let insertCM_CompAsia = "";

  const existing = await connection.query(`SELECT id
                                           FROM credit_model.CM_CompAsia
                                           where OrderID = ?`, [orderID]);

  // more than one record exists, order already exists
  if (existing.length > 0) {
    return {
      status: "already exists"
    }
  }
  if (monthly_income) {
    insertCM_CompAsia = `INSERT INTO credit_model.CM_CompAsia (NRIC, OrderID, Loan_Application_Date, gendercodename,
                                                               age, monthly_income, no_of_facility, net_salary,
                                                               Tenure, Device_monthly_repayment)
                         VALUES ('${nric}', '${orderID}', '${today}', ${gendercodename}, ${age}, ${monthly_income},
                                 ${no_of_facility}, 0.00, ${Tenure}, ${device_montly_payment})`;
  } else {
    insertCM_CompAsia = `INSERT INTO credit_model.CM_CompAsia (NRIC, OrderID, Loan_Application_Date, gendercodename,
                                                               age, monthly_income, no_of_facility, net_salary,
                                                               Tenure, Device_monthly_repayment)
                         VALUES ('${nric}', '${orderID}', '${today}', ${gendercodename}, ${age}, 0.00,
                                 ${no_of_facility}, ${nett_salary}, ${Tenure}, ${device_montly_payment})`;
  }

  console.log(insertCM_CompAsia);

  const itemInsertCM = await connection.query(insertCM_CompAsia);

  console.log("itemInsertCM", itemInsertCM);

  let sqlCreditModeller = `CALL credit_model.SP_CM_Credit_Model('${nric}','${orderID}','${ReqNo}');call credit_model.sp_CM_Final ('${nric}','${orderID}', @FINAL);SELECT @FINAL`;

  let result = await connection.getall(sqlCreditModeller);
  console.log(result);
  let item = Object.values(result[2][0]);
  if (item[0] == 1) {
    return {
      status: "approved",
    };
  } else if (item[0] == 0) {
    return {
      status: "failed",
    };
  } else {
    return {
      status: "failed",
    };
  }
};
