const connection = require("../middlewares/db");
const insertSP = require("./insertSP");

module.exports = async function insertSPUpdateCbm(
  nric,
  orderID,
  ReqNo,
  gendercodename,
  age,
  monthly_income,
  nett_salary,
  device_montly_payment,
  Tenure,
  no_of_facility,
  EntityCode
) {
  let SPResult = await insertSP(
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
  );
  if (SPResult.status === "already exists") {
    const [latestCustomerInfo] = await connection.query(
      `
        SELECT status
        FROM credit_model.cbm_customer
        WHERE NRIC = ?
        ORDER BY CreatedAt DESC
        LIMIT 1
    `,
      [nric]
    );

    if (!latestCustomerInfo) {
      console.error(
        "FATAL! insertSP returned status as already exists, but there is no record in cbm customer!",
        {
          nric,
          orderID,
          ReqNo,
          gendercodename,
          age,
          monthly_income,
          nett_salary,
          device_montly_payment,
          Tenure,
          no_of_facility,
        }
      );
      return {
        status: "failed",
      };
    }

    return {
      status: latestCustomerInfo.status,
    };
  }
  if (SPResult.status === "approved") {
    updateStatus = `UPDATE credit_model.cbm_customer
                    SET status    = '${SPResult.status}',
                        ReqNo     = '${ReqNo}',
                        entity_code = '${EntityCode ? EntityCode : ""}',
                        remark='Approved Credit Check',
                        errorCode = ''
                    WHERE NRIC = ${nric}
                    ORDER BY CreatedAt DESC
                    LIMIT 1`;
    updateQuery = await connection.query(updateStatus);
    console.log("success update", updateQuery);
    return {
      status: "approved",
    };
  } else if (SPResult.status === "failed") {
    updateStatus = `UPDATE credit_model.cbm_customer
                    SET status    = '${SPResult.status}',
                        ReqNo     = '${ReqNo}',
                        entity_code = '${EntityCode ? EntityCode : ""}',
                        remark='Failed Credit Check',
                        errorCode = ''
                    WHERE NRIC = ${nric}
                    ORDER BY CreatedAt DESC
                    LIMIT 1`;
    updateQuery = await connection.query(updateStatus);
    console.log("failed update", updateQuery);
    return {
      status: "failed",
    };
  } else {
    return SPResult.status;
  }
};
