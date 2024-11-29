const connection = require("../middlewares/db");
const insertSP = require("./insertSP");
const cbmRequest = require("./cbmRequest");
const insertSPUpdateCbm = require("./insertSPUpdateCbm");
const secondCbmRequest = require("./secondCbmRequest");
const retry = 3;
const cbmLogger = require("../../config/cbm-logger");

module.exports = async function creditCheckV2(
  name,
  dob,
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
  let result;
  const customerStatus = `SELECT a.ReqNo as 'customerReqNo', a.entity_code as 'entityCode', b.ReqNo as 'headerReqNo'  FROM credit_model.cbm_customer a LEFT JOIN credit_model.cbm_header b ON a.NRIC = b.NRIC 
  WHERE a.NRIC = '${nric}' AND active = 1
  `;
  cbmLogger.info(
    `second request for approved and failed ${JSON.stringify(customerStatus)}`
  );

  let { customerReqNo, entityCode, headerReqNo } = await connection.getrow(
    customerStatus
  );

  if (!entityCode) {
    let deleteCMCompasia = await deleteCbmCompAsiaByNRIC(nric, orderID);

    result = await insertSPUpdateCbm(
      nric,
      orderID,
      customerReqNo,
      gendercodename,
      age,
      monthly_income,
      nett_salary,
      device_montly_payment,
      Tenure,
      no_of_facility,
      entityCode
    );

    cbmLogger.info(`Customer ${nric} does not have entity code`, result);
    console.log(result);

    return result;
  }

  if (customerReqNo && entityCode) {
    if (!headerReqNo) {
      cbmLogger.info(
        `Customer ${nric} does not have header ReqNo, proceed to request new one`
      );

      result = await cbmRequest(
        name,
        dob,
        nric,
        orderID,
        retry,
        gendercodename,
        age,
        monthly_income,
        nett_salary,
        device_montly_payment,
        Tenure,
        no_of_facility
      );

      cbmLogger.info(`Customer ${nric} is ${result}`);
      console.log(result);

      return result;
    } else {
      cbmLogger.info(
        `Customer ${nric} will proceed to request to cbm with ReqNo ${ReqNo} and EntityCode ${entityCode}`
      );
      //delete from compasia table
      let deleteCbmCompasiaCustomer = await deleteCbmCompAsiaByNRIC(
        nric,
        orderID
      );

      //delete from all cbm table
      let deleteAllCbm = await deleteAllCbmTable(nric, ReqNo);
      result = await secondCbmRequest(
        name,
        dob,
        nric,
        orderID,
        retry,
        gendercodename,
        age,
        monthly_income,
        nett_salary,
        device_montly_payment,
        Tenure,
        no_of_facility,
        customerReqNo,
        entityCode
      );
    }

    cbmLogger.info(`Customer ${nric} is ${result}`);
    console.log(result);

    return result;
  } else {
    return {
      status: "failed",
      response: "No ReqNo from customer and ReqNo from header",
    };
  }
};

async function deleteCbmCompAsiaByNRIC(nric, orderID) {
  cbmLogger.info(
    `Delete Customer record in CM_CompAsia with NRIC: ${nric} and orderID: ${orderID}`
  );
  let deleteCustomerStatus = `DELETE FROM credit_model.CM_CompAsia WHERE NRIC = ${nric} AND orderID = '${orderID}'`;

  let deleteCustomerQuery = await connection.execute(deleteCustomerStatus);

  console.log("deleteCustomerQuery", deleteCustomerQuery);
  if (!deleteCustomerQuery) {
    cbmLogger.info(
      `Didnt manage to delete this customer in CM_CompAsia ${nric} and orderId: $${orderID}`
    );
    console.log("didnt manage to delete the customer");
  }

  return;
}

async function deleteAllCbmTable(nric, reqNo) {
  cbmLogger.info(
    `Delete Customer record in all cbm tables with NRIC: ${nric} and ReqNo: ${reqNo}`
  );
  let deleteAllCbmRecord = `DELETE FROM credit_model.cbm_accounts_instlarr WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_accounts_legSts WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_accounts_mcol WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_accounts_new_subacc WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_accounts_scols WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_accounts_subacc WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_ccris_profile WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_header WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_industries_creditor WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_industry_accounts WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_loaninfo_accounts WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_loaninfo_applications WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_loaninfo_instlyr WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_loaninfo_specAttn WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_loaninfo_summary WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_profile WHERE IdNo = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_profile_litigation WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_profile_loaninfo WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_profile_scoring WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_profile_summary WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_profile_tradereference WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_tradereference_industries WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';
  DELETE FROM credit_model.cbm_tradereference_instlyr WHERE NRIC = '${nric}' and ReqNo = '${reqNo}';`;

  let deleteAllCbmQuery = await connection.execute(deleteAllCbmRecord);

  console.log("deleteAllCbmQuery", deleteAllCbmQuery);
  if (!deleteAllCbmQuery) {
    cbmLogger.info(
      `Didnt manage to delete all CBM related records for this ${nric} and ${reqNo}`
    );
    console.log("didnt manage to delete record from cbm");
  }

  return;
}

// let SPResult = await insertSP(
//     nric,
//     orderID,
//     ReqNo,
//     gendercodename,
//     age,
//     monthly_income,
//     nett_salary,
//     device_montly_payment,
//     Tenure,
//     no_of_facility
//   );

//   if (SPResult.status === "already exists") {
//     const [latestCustomerInfo] = await connection.query(
//       `
//     SELECT status
//     FROM credit_model.cbm_customer
//     WHERE NRIC = ?
//     ORDER BY CreatedAt DESC
//     LIMIT 1
// `,
//       [nric]
//     );

//     if (!latestCustomerInfo) {
//       console.error(
//         "FATAL! insertSP returned status as already exists, but there is no record in cbm customer!",
//         {
//           nric,
//           orderID,
//           ReqNo,
//           gendercodename,
//           age,
//           monthly_income,
//           nett_salary,
//           device_montly_payment,
//           Tenure,
//           no_of_facility,
//         }
//       );
//       return {
//         status: "failed",
//       };
//     }

//     return {
//       status: latestCustomerInfo.status,
//     };
//   }
//   if (SPResult.status === "approved") {
//     updateStatus = `UPDATE credit_model.cbm_customer
//                 SET status    = '${SPResult.status}',
//                     ReqNo     = '${ReqNo}',
//                     remark='Approved Credit Check',
//                     errorCode = ''
//                 WHERE NRIC = ${nric}
//                 ORDER BY CreatedAt DESC
//                 LIMIT 1`;
//     updateQuery = await connection.query(updateStatus);
//     console.log("success update", updateQuery);
//     return {
//       status: "approved",
//     };
//   } else if (SPResult.status === "failed") {
//     updateStatus = `UPDATE credit_model.cbm_customer
//                 SET status    = '${SPResult.status}',
//                     ReqNo     = '${ReqNo}',
//                     remark='Failed Credit Check',
//                     errorCode = ''
//                 WHERE NRIC = ${nric}
//                 ORDER BY CreatedAt DESC
//                 LIMIT 1`;
//     updateQuery = await connection.query(updateStatus);
//     console.log("failed update", updateQuery);
//     return {
//       status: "failed",
//     };
//   } else {
//     return SPResult.status;
//   }
