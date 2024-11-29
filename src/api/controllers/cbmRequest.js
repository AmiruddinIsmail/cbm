const connection = require("../middlewares/db");
const getCData = require("../utils/checkXML");
const insertSP = require("./insertSP");
const getEntity = require("../utils/getEntity");
const xmlToJson = require("../utils/convert");
const fs = require("fs");
const moment = require("moment");
const https = require("https");
const axios = require("axios");
const upload = require("../utils/s3");
const errorCbm = require("../utils/cbm/ErrorCbm");
const insertDBXML = require("./insertXML");
const cbmLogger = require("../../config/cbm-logger");
const insertTestXML = require("./insertTestXML");
const insertSPUpdateCbm = require("./insertSPUpdateCbm");

module.exports = async function cbmRequest(
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
) {
  let url = "https://live.creditbureau.com.my/scbs/B2BServiceAction";

  let ca_file = fs.readFileSync("./certs/DigiCertCA.crt", "utf-8");
  var newDate = new Date();
  var currentDate = moment(newDate).format("DD/MM/YYYY HH:mm:ss");
  let sqlUpdatePending = "",
    sqlUpdatePendingQuery = "";

  // const firstRequest = `<Request>
  //     <SystemID>SCBS</SystemID>
  //     <Service>INDDTLRPTS</Service>
  //     <ReportType>CCR</ReportType>
  //     <MemberID>${process.env.prod_memberID}</MemberID>
  //   <UserID>${process.env.prod_userID}</UserID>
  //     <ReqNo></ReqNo>
  //     <SequenceNo>001</SequenceNo>
  //     <ReqDate>${currentDate}</ReqDate>
  //     <PurposeStdCode>CREREV</PurposeStdCode>
  //     <CostCenterStdCode></CostCenterStdCode>
  //     <ConsentFlag></ConsentFlag>
  //     <Subject>
  //         <IdNo1>${nric}</IdNo1>
  //         <IdNo2></IdNo2>
  //         <Name>${name}</Name>
  //         <Dob>${dob}</Dob>
  //         <ConstitutionTypeStdCode>11</ConstitutionTypeStdCode>
  //         <EmailAddr></EmailAddr>
  //         <MobileNo></MobileNo>
  //         <NationalityStdCode>MY</NationalityStdCode>
  //         <EntityCode></EntityCode>
  //         <TradeEntityCode></TradeEntityCode>
  //     </Subject>
  // </Request>`;

  const firstRequest = `<Request>
	<SystemID>SCBS</SystemID>
	<Service>INDDTLRPTS</Service>
	<ReportType>CCR</ReportType>
	<MemberID>${process.env.prod_memberID}</MemberID>
	<UserID>${process.env.prod_userID}</UserID>
	<ReqNo/>
	<SequenceNo>001</SequenceNo>
	<ReqDate>${currentDate}</ReqDate>
	<PurposeStdCode>CREREV</PurposeStdCode>
	<CostCenterStdCode/>
	<Subject>
		<IdNo1>${nric}</IdNo1>
		<IdNo2/> 
		<Name>${name}</Name>
		<Dob>${dob}</Dob>
		<ConstitutionTypeStdCode>011</ConstitutionTypeStdCode>
		<NationalityStdCode>MY</NationalityStdCode>
		<EntityCode/>
		<TradeEntityCode/>
		<Email/>
		<MobileNo/>
	</Subject>
</Request>`;

  cbmLogger.info(firstRequest);
  console.log("firstRequest", firstRequest);

  const agent = new https.Agent({
    rejectUnauthorized: false,
    ca: ca_file,
  });

  const options = {
    url,
    method: "POST",
    httpsAgent: agent,
    headers: {
      "Content-Type": "text_xml",
    },
    data: firstRequest,
    timeout: 300000,
  };

  let firstResponse = await axios(options)
    .then((response) => {
      return response.data;
    })
    .catch(async (err) => {
      console.log(err);
      sqlUpdatePending = `UPDATE credit_model.cbm_customer SET status = 'pending', ReqNo = '', remark = 'Timeout on the first Response' WHERE NRIC = '${nric}' ORDER BY CreatedAt DESC LIMIT 1`;
      sqlUpdatePendingQuery = await connection.query(sqlUpdatePending);
      console.log(sqlUpdatePendingQuery);
      return {
        status: "pending",
        error: "first Response Error",
        code: 200,
        retry: retry - 1,
      };
    });

  cbmLogger.info(firstResponse);
  console.log(firstResponse);

  if (firstResponse.code === 200) {
    return firstResponse;
  }

  let checkFirstResponseError = await errorCbm(firstResponse, "first Response");

  if (checkFirstResponseError.code === 500) {
    cbmLogger.info(JSON.stringify(checkFirstResponseError));
    console.log("firstResponseError", checkFirstResponseError);
    sqlUpdatePending = `UPDATE credit_model.cbm_customer SET status = 'pending', ReqNo = '', remark='${checkFirstResponseError.message}', errorCode='${checkFirstResponseError.errorCode}' WHERE NRIC = '${nric}' ORDER BY CreatedAt DESC LIMIT 1;`;
    console.log(sqlUpdatePending);
    sqlUpdatePendingQuery = await connection.query(sqlUpdatePending);
    console.log("firstResponseUpdateQuery", sqlUpdatePendingQuery);
    return checkFirstResponseError;
  }

  let EntityCode;
  try {
    EntityCode = await getEntity(firstResponse);
    console.log("EntityCode", EntityCode);
  } catch (error) {
    sqlUpdatePending = `UPDATE credit_model.cbm_customer SET status = 'failed', ReqNo = '${checkFirstResponseError}', remark='Failed credit check due to no CCRIS Profile' WHERE NRIC = ${nric} ORDER BY CreatedAt DESC LIMIT 1`;
    sqlUpdatePendingQuery = await connection.query(sqlUpdatePending);
    return {
      status: "failed",
      error: "Entity Code Error",
      code: 200,
    };
  }

  let ReqNo;
  try {
    ReqNo = await xmlToJson(firstResponse);
  } catch (error) {
    return {
      status: "pending",
      error: "ReqNo Code Error",
      code: 200,
      retry: retry - 1,
    };
  }

  if (isNaN(ReqNo)) {
    if (ReqNo[0].ErrorStdCode[0] === "010") {
      return {
        status: "pending",
        response: "The Time Connection has timed out",
        error: "B2B Services Unavailable",
        code: 200,
        retry: retry - 1,
      };
    } else {
      return {
        status: "pending",
        response: "CCRIS not available",
        code: 200,
        retry: retry - 1,
      };
    }
  }
  console.log(ReqNo);

  const secondRequest = `<Request>
    <SystemID>SCBS</SystemID>
    <Service>INDDTLRPTS</Service>
    <ReportType>CCR</ReportType>
    <MemberID>${process.env.prod_memberID}</MemberID>
    <UserID>${process.env.prod_userID}</UserID>
    <ReqNo>${ReqNo}</ReqNo>
    <SequenceNo>002</SequenceNo>
    <ReqDate>${currentDate}</ReqDate>
    <PurposeStdCode>CREREV</PurposeStdCode>
    <CostCenterStdCode></CostCenterStdCode>
    <ConsentFlag>Y</ConsentFlag>
    <Subject>
        <IdNo1>${nric}</IdNo1>
        <IdNo2></IdNo2>
        <Name>${name}</Name>
        <Dob>${dob}</Dob>
        <ConstitutionTypeStdCode>011</ConstitutionTypeStdCode>
        <ConstitutionType>Individual</ConstitutionType>
        <NationalityStdCode>MY</NationalityStdCode>
        <EmailAddr></EmailAddr>
        <MobileNo></MobileNo>
        <EntityCode>${EntityCode}</EntityCode>
        <TradeEntityCode></TradeEntityCode>
        <Warning></Warning>
        <Vehicle1></Vehicle1>
        <Vehicle2></Vehicle2>
        <Vehicle3></Vehicle3>
        <Vehicle4></Vehicle4>
        <Vehicle5></Vehicle5>
    </Subject>
  </Request>`;

  cbmLogger.info(secondRequest);
  console.log("secondRequest", secondRequest);

  const secondOption = {
    url,
    method: "POST",
    httpsAgent: agent,
    headers: {
      "Content-Type": "text_xml",
    },
    data: secondRequest,
    timeout: 300000,
  };

  let secondResponse = await axios(secondOption)
    .then((response) => {
      cbmLogger.info(response);
      return response.data;
    })
    .catch(async (err) => {
      console.log(err);
      sqlUpdatePending = `UPDATE credit_model.cbm_customer SET status = 'pending', ReqNo = '${ReqNo}', remark = 'Timeout on second Response' WHERE NRIC = ${nric} ORDER BY CreatedAt DESC LIMIT 1`;
      sqlUpdatePendingQuery = await connection.query(sqlUpdatePending);
      return {
        status: "pending",
        error: "Second Response error",
        code: 200,
        retry: retry - 1,
      };
    });

  cbmLogger.info(secondResponse);
  console.log("secondResponse", secondResponse);

  if (secondResponse.code === 200) {
    return secondResponse;
  }

  let secondResponseError = await errorCbm(secondResponse, "second Response");
  console.log("secondResponseError", secondResponseError);
  if (secondResponseError.code === 500) {
    cbmLogger.info(JSON.stringify(secondResponseError));
    sqlUpdatePending = `UPDATE credit_model.cbm_customer SET status = 'pending', ReqNo = '${ReqNo}', remark='${secondResponseError.message}', errorCode='${secondResponseError.errorCode}' WHERE NRIC = '${nric}' ORDER BY CreatedAt DESC LIMIT 1;`;
    sqlUpdatePendingQuery = await connection.query(sqlUpdatePending);
    console.log("secondResponseUpdateQuery", sqlUpdatePendingQuery);
    return secondResponseError;
  }

  const thirdRequest = `<Request>
  <SystemID>SCBS</SystemID>
  <Service>INDDTLRPTS</Service>
  <ReportType>CCR</ReportType>
  <MemberID>${process.env.prod_memberID}</MemberID>
  <UserID>${process.env.prod_userID}</UserID>
  <ReqNo>${ReqNo}</ReqNo>
  <SequenceNo>004</SequenceNo>
  <ReqDate>${currentDate}</ReqDate>
  <PurposeStdCode>CREREV</PurposeStdCode>
  <CostCenterStdCode></CostCenterStdCode>
  <ConsentFlag>Y</ConsentFlag>
  <Subject>
      <IdNo1>${nric}</IdNo1>
      <IdNo2></IdNo2>
      <Name>${name}</Name>
      <Dob>${dob}</Dob>
      <ConstitutionTypeStdCode>011</ConstitutionTypeStdCode>
      <ConstitutionType>Individual</ConstitutionType>
      <NationalityStdCode>MY</NationalityStdCode>
      <EmailAddr></EmailAddr>
      <MobileNo></MobileNo>
      <EntityCode>${EntityCode}</EntityCode>
      <TradeEntityCode></TradeEntityCode>
      <Warning></Warning>
      <Vehicle1></Vehicle1>
      <Vehicle2></Vehicle2>
      <Vehicle3></Vehicle3>
      <Vehicle4></Vehicle4>
      <Vehicle5></Vehicle5>
  </Subject>
  </Request>`;

  cbmLogger.info(thirdRequest);
  console.log("thirdRequest", thirdRequest);

  const thirdOption = {
    url,
    method: "POST",
    httpsAgent: agent,
    headers: {
      "Content-Type": "text_xml",
    },
    data: thirdRequest,
    timeout: 300000,
  };

  let thirdResponse = await axios(thirdOption)
    .then((response) => {
      return response.data;
    })
    .catch(async (err) => {
      sqlUpdatePending = `UPDATE credit_model.cbm_customer SET status = 'pending', ReqNo = '${ReqNo}', remark = 'Timeout on the third Response' WHERE NRIC = ${nric} ORDER BY CreatedAt DESC LIMIT 1`;
      sqlUpdatePendingQuery = await connection.query(sqlUpdatePending);
      return {
        status: "pending",
        code: 200,
        error: "Third Response Error",
        retry: retry - 1,
      };
    });

  cbmLogger.info(thirdResponse);
  console.log("third Response", thirdResponse);

  if (thirdResponse.code === 200) {
    return thirdResponse;
  }

  let thirdResponseError = await errorCbm(thirdResponse, "third Response");
  if (thirdResponseError.code === 500) {
    cbmLogger.info(JSON.stringify(thirdResponseError));
    console.log("thirdResponseError", thirdResponseError);
    sqlUpdatePending = `UPDATE credit_model.cbm_customer SET status = 'pending', ReqNo = '${ReqNo}', remark='${thirdResponseError.message}', errorCode='${thirdResponseError.errorCode}' WHERE NRIC = '${nric}' ORDER BY CreatedAt DESC LIMIT 1;`;
    sqlUpdatePendingQuery = await connection.query(sqlUpdatePending);
    console.log("thirdResponseUpdateQuery", sqlUpdatePendingQuery);
    return thirdResponseError;
  }

  let CData = await getCData(thirdResponse);
  fs.writeFileSync(`./xml/${nric}.xml`, CData);

  try {
    let item = await upload(CData, nric);
  } catch (error) {
    throw error;
  }

  let updateStatus = "",
    updateQuery = "";

  if (CData.status === "failed") {
    return {
      status: "failed",
      response: CData.error,
    };
  } else {
    await insertTestXML(nric, ReqNo);
    const insertUpdateResponse = await insertSPUpdateCbm(
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
    );
    return insertUpdateResponse;
  }
};
