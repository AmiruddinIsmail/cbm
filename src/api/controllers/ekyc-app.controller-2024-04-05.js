const fs = require("fs");
const xmlToJson = require("../utils/convert");
const generatePaymentLinkValidation = require("../validations/generate-payment-link.schema");
const recurringPaymentValidation = require("../validations/recurring-payment.schema");
const generateInstantPaymentLinkValidation = require("../validations/instant-pay-link.schema");
const connection = require("../middlewares/db.js");
const logger = require("../../config/logger");
const axios = require("axios");
const https = require("https");
const cbmLogger = require("../../config/cbm-logger");
const getCData = require("../utils/checkXML");
const randomstring = require("randomstring");
const _ = require("lodash");
const moment = require("moment");
const crypto = require("crypto");
const getEntity = require("../utils/getEntity");
const insertDBXML = require("./insertXML");
const insertSP = require("./insertSP");
const qs = require("qs");
const xlsx = require("xlsx");
const insertSPUAT = require("./insertSPUAT");
const cbmRequest = require("./cbmRequest");
const upload = require("../utils/s3");
const readS3 = require("../utils/readS3");
let mountAPI = "/ekyc-app";
const { url } = require("inspector");
const { DateTime } = require("luxon");
const { json } = require("body-parser");
const errorCbm = require("../utils/cbm/ErrorCbm");
const { encode } = require("punycode");
const insertTestXML = require("./insertTestXML");
const insertSPUpdateCbm = require("./insertSPUpdateCbm");
const creditCheckV2 = require("./creditCheckV2");

const configVariable = {
  failed: `${process.env.domain}${mountAPI}/fail.gif`,
  logo: `${process.env.domain}${mountAPI}/renew_plus_icon.png`,
  sucess: `${process.env.domain}${mountAPI}/success.gif`,
  compareName: false,
  checksum: true,
};

if (process.env.NODE_ENV == "production") {
  mountAPI = "";
  configVariable.failed = `${process.env.domain}/fail.gif`;
  configVariable.logo = `${process.env.domain}/renew_plus_icon.png`;
  configVariable.sucess = `${process.env.domain}/success.gif`;
  configVariable.compareName = true;
  configVariable.checksum = true;
}

const ORDER_STATUS = {
  CANCELLED: 3,
  FAILED_PAYMENT: 13,
};

const description = "Programme Fee 1st Month";

exports.testSP = async (req, res, next) => {
  let nric = '920208085405';
  let ReqNo = '20231123415980';
  let orderID = '2843';
  console.log(process.env.domain)
  try {
    let resSPCMCreditModel = await axios.post(`${process.env.BACKEND_RENEWPLUS}/api/credit_model/sp_cm_credit_model`, {
      NRIC: nric,
      ReqNo: ReqNo,
      OrderID: orderID,
    });

    if (resSPCMCreditModel.data.status !== 'OK') {
      console.log(`Failed SPCMCreditModel, nric:${nric}, reqNo:${ReqNo}, orderID: ${orderID}`);
      return {
        status: "failed",
      };
    }

    let resSPCMFinal = await axios.post(`${process.env.BACKEND_RENEWPLUS}/api/credit_model/sp_cm_final`, {
      NRIC: nric,
      ReqNo: ReqNo,
      OrderID: orderID,
    });

    if (resSPCMFinal.data == 1) {
      console.log(`SUCCESS SPCMFinal, nric:${nric}, reqNo:${ReqNo}, orderID: ${orderID}`);
      return {
        status: "approved",
      };
    } else {
      return {
        status: "failed",
      };
    }
  } catch (err) {
    console.log(`FAILED SPCMCreditModel OR SPCMFinal, nric:${nric}, reqNo:${ReqNo}, orderID: ${orderID}, ${err}`);
    return {
      status: "failed",
    };
  }

  // let firstResponse = fs.readFileSync("./testResponse.xml", "utf-8");
  // await insertTestXML("910405105322", 202305248165330);
};

exports.templateXML = async (req, res, next) => {
  const {
    nric,
    orderID,
    gendercodename,
    age,
    monthly_income,
    nett_salary,
    device_montly_payment,
  } = req.body;

  const thirdResponse = "third XML Response";
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
    await insertDBXML(nric, ReqNo);
    let SPResult = await insertSP(
      nric,
      orderID,
      ReqNo,
      gendercodename,
      age,
      monthly_income,
      nett_salary,
      device_montly_payment
    );
    if (SPResult.status == "approved") {
      updateStatus = `UPDATE credit_model.cbm_customer SET status = '${SPResult.status}', ReqNo = '${ReqNo}', remark='Approved Credit Check', errorCode = '' WHERE NRIC = ${nric} ORDER BY CreatedAt DESC LIMIT 1`;
      updateQuery = await connection.query(updateStatus);
      console.log("success update", updateQuery);
      return {
        status: "approved",
      };
    } else if (SPResult.status == "failed") {
      updateStatus = `UPDATE credit_model.cbm_customer SET status = '${SPResult.status}', ReqNo = '${ReqNo}', remark='Failed Credit Check', errorCode = '' WHERE NRIC = ${nric}  ORDER BY CreatedAt DESC LIMIT 1`;
      updateQuery = await connection.query(updateStatus);
      console.log("failed update", updateQuery);
      return {
        status: "failed",
      };
    } else {
      console.warn(
        `Warning: Expected status to be "approved", "failed", or but got this instead`,
        SPResult
      );
      console.warn(`Returning as is for now`);
      return SPResult.status;
    }
  }
};

async function creditCheckForApprovedFailed(
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
  const insertUpdateResponse = await creditCheckV2(
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
  );
  return insertUpdateResponse;
}

exports.testXML = async (req, res, next) => {
  const {
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
  } = req.body;
  var today = moment().toISOString();

  const data = req.body;

  console.log(data);
  cbmLogger.info(JSON.stringify(data));

  let item = await connection.getrow(
    `SELECT * FROM ${process.env.CREDITMODEL}.cbm_customer WHERE NRIC=${nric} ORDER BY CreatedAt DESC LIMIT 1`
  );
  console.log(item);
  cbmLogger.info(JSON.stringify(item));

  if (!item) {
    let sqlCreateCustomer = `INSERT INTO credit_model.cbm_customer (NRIC, CreatedAt, ReqNo, remark, errorCode, active) VALUES ('${nric}', '${today}', '', 'Created New User', '', 1) `;

    let itemCreateCustomer = await connection.query(sqlCreateCustomer);
    console.log("newCreateCustomer", itemCreateCustomer);
    cbmLogger.info(itemCreateCustomer);
    let result = await cbmRequest(
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
    return res.json(result);
  } else {
    let { NRIC, CreatedAt, status, ReqNo } = await connection.getrow(
      `SELECT * FROM ${process.env.CREDITMODEL}.cbm_customer WHERE NRIC=${nric} ORDER BY CreatedAt DESC LIMIT 1`
    );
    const past_day = moment(CreatedAt).add("YYYY-MM-DD");
    var diff = past_day.diff(today, "days");
    let result;

    if (NRIC) {
      if (Math.abs(diff) < 30) {
        switch (status) {
          case "approved":
          case "failed":
            // Related ticket: <to be filled in, i dunno we dont have a ticket system yet>
            const response = await creditCheckForApprovedFailed(
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
            );

            cbmLogger.info({
              status,
              message: "new credit check",
              resp: response,
            });
            return res.json(response);
          case "pending":
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
            console.log("check result with pending", result);
            cbmLogger.info(result);
            return res.json(result);
          default:
            break;
        }
      } else {
        let changeActive = `UPDATE credit_model.cbm_customer SET active = 0 WHERE NRIC = '${nric}'`;
        let changeActiveQuery = await connection.execute(changeActive);
        console.log(changeActiveQuery);
        let insertAfterThirtyDays = `INSERT INTO credit_model.cbm_customer (NRIC, CreatedAt, ReqNo, remark, errorCode, active) VALUES ('${nric}', '${today}', '', 'Created Record After 30 days', '', 1)`;
        let insertQueryAfter = await connection.execute(insertAfterThirtyDays);
        console.log("insertQueryAfter", insertQueryAfter);
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
        return res.json(result);
      }
    } else {
      cbmLogger.info("does not have IC");
      return res.json({
        status: "failed",
      });
    }
  }
};

exports.loopExcel = async (req, res, next) => {
  var workbook = xlsx.readFile("./data.xlsx", { type: "buffer" });
  let result = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    for (const item of data) {
      const dob = item["dob"];
      const nric = item["nric"];
      const orderID = item["orderID"];
      const name = item["fullname"];
      const gendercodename = item["gendercodename"];
      const retry = item["retry"];
      const age = item["age"];
      const monthly_income = item["monthly_income"];
      const nett_salary = item["nett_salary"];
      const device_monthly_income = item["device_monthly_income"];
      const tenure = item["tenure"];
      const no_of_facility = item["no_of_facility"];
      console.log(dob);

      let url = "https://live.creditbureau.com.my/scbs/B2BServiceAction";
      // let url = "https://uat.creditbureau.com.my/scbs/B2BServiceAction";
      let ca_file = fs.readFileSync("./certs/DigiCertCA.crt", "utf-8");
      var newDate = new Date();
      var currentDate = moment(newDate).format("DD/MM/YYYY HH:mm:ss");

      const firstRequest = `<Request>
        <SystemID>SCBS</SystemID>
        <Service>INDDTLRPTS</Service>
        <ReportType>CCR</ReportType>
        <MemberID>${process.env.prod_memberID}</MemberID>
        <UserID>${process.env.prod_userID}</UserID>
        <ReqNo></ReqNo>
        <SequenceNo>001</SequenceNo>
        <ReqDate>${currentDate}</ReqDate>
        <PurposeStdCode>CREREV</PurposeStdCode>
        <CostCenterStdCode></CostCenterStdCode>
        <ConsentFlag></ConsentFlag>
        <Subject>
          <IdNo1>${nric}</IdNo1>
          <IdNo2></IdNo2>
          <Name>${name}</Name>
          <Dob>${dob}</Dob>
          <ConstitutionTypeStdCode>11</ConstitutionTypeStdCode>
          <EmailAddr></EmailAddr>
          <MobileNo></MobileNo>
          <NationalityStdCode>MY</NationalityStdCode>
          <EntityCode></EntityCode>
          <TradeEntityCode></TradeEntityCode>
        </Subject>
       </Request>`;

      console.log(firstRequest);

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
        timeout: 600000,
      };

      let firstResponse = await axios(options)
        .then((response) => {
          return response.data;
        })
        .catch((err) => {
          console.log(err);
        });
      console.log(firstResponse);

      let EntityCode;
      try {
        EntityCode = await getEntity(firstResponse);
      } catch (error) {
        console.log(error);
      }

      let ReqNo = await xmlToJson(firstResponse);

      console.log("ReqNo", ReqNo);

      if (isNaN(ReqNo)) {
        if (ReqNo[0].ErrorStdCode[0] === "010") {
          console.log("error");
        } else {
          console.log("error");
        }
      }

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

      const secondOption = {
        url,
        method: "POST",
        httpsAgent: agent,
        headers: {
          "Content-Type": "text_xml",
        },
        data: secondRequest,
        timeout: 600000,
      };

      let secondResponse = await axios(secondOption)
        .then((response) => {
          return response.data;
        })
        .catch((err) => {
          console.log("error");
        });

      console.log("secondResponse", secondResponse);

      // await this.sleep(900000);

      console.log("continue back");

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

      const thirdOption = {
        url,
        method: "POST",
        httpsAgent: agent,
        headers: {
          "Content-Type": "text_xml",
        },
        data: thirdRequest,
        timeout: 600000,
      };

      let thirdResponse = await axios(thirdOption)
        .then((response) => {
          return response.data;
        })
        .catch((err) => {
          console.log(err);
        });

      console.log("thirdResponse", thirdResponse);

      let CData = await getCData(thirdResponse);
      fs.writeFileSync(`./xml/${nric}.xml`, CData);

      if (CData.status === "failed") {
        return res.json({
          status: "failed",
          response: CData.error,
        });
      } else {
        // await insertDBXML(nric, ReqNo)
        await insertTestXML(nric, ReqNo);
        let SPResult = await insertSP(
          nric,
          orderID,
          ReqNo,
          gendercodename,
          age,
          monthly_income,
          nett_salary,
          device_monthly_income,
          tenure,
          no_of_facility
        );

        var today = moment().toISOString();
        console.log(SPResult);
        if (SPResult.status == "approved") {
          console.log("approved");
          let insertApprovedStatus = `INSERT INTO credit_model.cbm_customer (NRIC, status, CreatedAt, ReqNo, remark, errorCode, active) VALUES ('${nric}', '${SPResult.status}','${today}', '${ReqNo}', 'Pass Credit Check', '', 1) `;
          let insertApprovedQuery = await connection.execute(
            insertApprovedStatus
          );
          console.log(insertApprovedQuery);
        } else if (SPResult.status == "failed") {
          let insertFailedStatus = `INSERT INTO credit_model.cbm_customer (NRIC, status, CreatedAt, ReqNo, remark, errorCode, active) VALUES ('${nric}', '${SPResult.status}','${today}', '${ReqNo}', 'Failed Credit Check', '', 1) `;
          let insertFailedQuery = await connection.execute(insertFailedStatus);
          console.log(insertFailedQuery);
        } else {
          console.log("weird things happen:", SPResult);
        }
      }
    }
  }
};

exports.bankList = async (req, res, next) => {
  try {
    const url = `${process.env.curlec_url}/curlec-services/banks?method=00&msgToken=01`;

    const resp = await axios({
      url,
      method: "POST",
    });

    if (!resp) {
      throw false;
    }

    if (!resp.data.Response) {
      return await this.bankList(req, res, next);
    }

    return res.json(resp.data.Response[0]);
  } catch (error) {
    if (error.message) return error.message;

    return error;
  }
};

exports.bankListing = async (req, res, next) => {
  try {
    const url = `${process.env.curlec_url}/curlec-services/banks?method=00&msgToken=01`;

    const resp = await axios({
      url,
      method: "POST",
    });

    if (!resp) {
      throw false;
    }

    if (!resp.data.Response) {
      return await this.bankListing();
    }

    return resp.data.Response;
  } catch (error) {
    if (error.message) return error.message;

    return error;
  }
};

exports.testReport = async (req, res, next) => {
  // const {
  //   name,
  //   dob,
  //   nric,
  //   orderID,
  //   retry,
  //   gendercodename,
  //   age,
  //   monthly_income,
  //   nett_salary,
  //   device_montly_payment,
  //   Tenure,
  //   no_of_facility,
  // } = req.body;

  // const body = req.body;
  // var today = moment().toISOString();

  // console.log(body);

  // if (monthly_income) {
  //   insertCM_CompAsia = `INSERT INTO credit_model.CM_CompAsia (NRIC, OrderID, Loan_Application_Date, gendercodename, age, monthly_income, no_of_facility, net_salary, Tenure, Device_monthly_repayment) VALUES ('${nric}', '${orderID}', '${today}', ${gendercodename}, ${age}, ${monthly_income}, ${no_of_facility}, 0.00, ${Tenure}, ${device_montly_payment})`;
  // } else {
  //   insertCM_CompAsia = `INSERT INTO credit_model.CM_CompAsia (NRIC, OrderID, Loan_Application_Date, gendercodename, age, monthly_income, no_of_facility, net_salary, Tenure, Device_monthly_repayment) VALUES ('${nric}', '${orderID}', '${today}', ${gendercodename}, ${age}, 0.00, 0, ${nett_salary},  ${Tenure}, ${device_montly_payment})`;
  // }

  // console.log(insertCM_CompAsia);

  // const itemInsertCM = await connection.query(insertCM_CompAsia);

  // console.log("itemInsertCM", itemInsertCM);
  return res.status(200).json({
    status: "pending",
    error: "first Response Error",
    code: 200,
  });
};

//order_status = 3 => Cancelled
exports.getInstantPay = async (req, res, next) => {
  let params = new URLSearchParams(req.query);

  const data = {
    title: "Renew Plus Instant Pay Status",
    status: "Payment Unsuccessful!",
    msg: `Thank you for your interest in applying to enrol for the Renew+ Subscription Program.
    We have reviewed your application and regret to inform you that your application is unsuccessful.
    The relevant charges that have been deducted from your account during the application process will be refunded to you within
    the next thirty (30) working days.`,
    url: `${process.env.renew_plus_url}/customer/create/auth/`,
    //image: images.image.failedGif,
    //logo: images.image.logo,
    image: configVariable.failed,
    logo: configVariable.logo,
    footer: ` We apologize for any incovenience caused. For any enquiries, kindly reach out to us at renew.plus@compasia.com`,
    order_status: ORDER_STATUS.FAILED_PAYMENT,
    renewPlusRedirectCallbackUrl: "",
  };

  const page = "instantPay";
  let status = false;

  try {
    let dataQuery;

    dataQuery = await connection.getrow(
      `select p.*,c.*,o.* from payment p
    LEFT JOIN customer c ON p.customer_id = c.id
    LEFT JOIN  \`order\` o ON c.id = o.customer_id
    where p.referenceNumber='${params.get("fpx_sellerOrderNo")}'`
    );

    params.set("name", dataQuery.first_name);
    params.set("cust_id", dataQuery.customer_id);
    params.set("timestamp", Date.now());

    logger.info(params);

    if (!dataQuery) {
      throw false;
    }

    const orderDetails = await connection.getrow(
      `select * from \`order\` where orderId= '${dataQuery.orderId}'`
    );

    if (!orderDetails) {
      throw false;
    }

    data.renewPlusRedirectCallbackUrl = `${process.env.BACKEND_RENEWPLUS}/api/customer/update_customer_process?id=${orderDetails.id}`;

    const hash = crypto
      .createHash("md5")
      .update(`${process.env.secret_key}${orderDetails.id}`)
      .digest("hex");

    data.url = `${process.env.renew_plus_url}/customer/create/auth/${orderDetails.id}/${hash}?status=${status}`;

    if (configVariable.compareName) {
      const compareName = await this.compareName(
        `${dataQuery.name_as_per_nric}`,
        params.get("fpx_buyerName"),
        dataQuery.customer_id
      );

      if (!compareName) {
        data.msg += "Please make sure that you use your bank account.";
        throw false;
      }
    }

    if (params.get("fpx_description")) {
      //Instant Pay

      if (
        params.get("fpx_debitAuthCode").toString() == "00" ||
        params.get("fpx_creditAuthCode").toString() == "00"
      ) {
        status = true;
        data.status = "Payment Successful!";
        data.msg =
          "Thank you for your order. Once your device is ready for collection, our crew will contact and assist you with the collection of the device at your preferred store.";
        data.url = encodeURI(
          `${process.env.renew_plus_url}/customer/create/auth/${orderDetails.id}/${hash}?status=${status}`
        );
        //data.image = images.image.successGif;
        data.image = configVariable.sucess;
        data.footer = `Please wait while we are redirecting you to Renew+ within 60 seconds.`;
        data.order_status = 1;
      }
    }

    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );

    return res.render(page, data);
  } catch (error) {
    console.log(error);
    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );

    return res.render(page, data);
  }
};

exports.merchantCallBackURL = async (req, res, next) => {
  /*let params = req.body;
  params.set("user", "User");
  params.set("user_id", "1");
  params.set("timestamp", Date.now());

  logger.info(res);*/

  /**
   *
   * curlec_method
   * 00 => Mandate
   * 01 => Instant Pay
   */

  try {
    const today = DateTime.fromJSDate(new Date()).toSQL();

    const params = req.body;

    const data = {};

    data.status = 0;

    if (params.fpx_debitAuthCode == "00" || params.fpx_creditAuthCode == "00") {
      data.status = 1;
    }

    console.log("req.body==>", req.body);

    /*params.set("user", "User");
    params.set("user_id", "1");
    params.set("timestamp", Date.now());

    logger.info(params);*/

    let dataQuery;

    dataQuery = await connection.getrow(
      `select p.*,c.*,o.* from payment p
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN  \`order\` o ON c.id = o.customer_id
      where p.referenceNumber='${params.fpx_sellerOrderNo}'`
    );

    if (!dataQuery) {
      throw { message: "dataQuery" };
    }

    const orderDetails = await connection.getrow(
      `select * from \`order\` where orderId= '${dataQuery.orderId}'`
    );

    if (!orderDetails) {
      throw { message: "orderDetails" };
    }

    const checkSession = await this.checkSession(dataQuery.customer_id);

    if (!checkSession) {
      throw "Session Expired. Please try again.";
    }

    /**
     * 1 => Processing
     * 6 => Checking
     * 8 => Mandate Success
     *
     * Ignore when the order status is already Checking or Mandate Success
     */
    let orderUpdateStatus = true;

    console.log(
      "(orderDetails.order_status_id==>",
      orderDetails.order_status_id
    );
    console.log("orderUpdateStatus==>", orderUpdateStatus);

    data.respondData = JSON.stringify(params).replace(/'/g, '"');

    const getStatus = this.defineResponsePayment(
      params.fpx_debitAuthCode.toString()
    );

    data.cancelReason = '';
    if (orderDetails.cancel_reason) {
      data.cancelReason += orderDetails.cancel_reason;
    }

    //Set other than Production Enviroment to be true

    let compareName = true;

    //For Production,this process must be true

    if (configVariable.compareName) {
      compareName = await this.compareName(
        `${dataQuery.name_as_per_nric}`,
        params.fpx_buyerName,
        dataQuery.customer_id,
        false
      );
    }

    // Mandate
    if (params.curlec_method == "00") {
      data.responseDateTime = "responseDateTimeMandate";
      data.response = "responseMandate";
      data.type = "mandate";
      data.request = "requestMandate";
      data.requestDateTime = "requestTimeDateMandate";
      data.order_status = data.status == 1 ? 8 : ORDER_STATUS.FAILED_PAYMENT;
      orderUpdateStatus =
        orderDetails.order_status_id == 6 ||
        orderDetails.order_status_id == 8 ||
        orderDetails.order_status_id == 1 ||
        orderDetails.order_status_id == 2
          ? false
          : true;
      data.checkPayment = "payment_check";
      data.checkPaymentDate = "payment_check_date";
    }

    //Instant Pay
    else if (params.curlec_method == "01") {
      data.responseDateTime = "responseDateTimeInstantPay";
      data.response = "responseInstantPay";
      data.type = "instant-pay";
      data.request = "requestInstantPay";
      data.requestDateTime = "requestDateTimeInstantPay";

      data.order_status = data.status == 1 ? 1 : ORDER_STATUS.FAILED_PAYMENT;

      orderUpdateStatus =
        orderDetails.order_status_id == 6 ||
        orderDetails.order_status_id == 1 ||
        orderDetails.order_status_id == 2
          ? false
          : true;

      data.checkPayment = "instantpay_status";
      data.checkPaymentDate = "payment_check_date";
    }

    const cancelReasonDate = DateTime.local().toFormat("yyyy/MM/dd HH.mm.ss");

    if (getStatus.statusCode != "00" && getStatus.statusDescription) {
      data.cancelReason += `${cancelReasonDate} ${getStatus.statusDescription}\n`;
    }

    if (!compareName && orderUpdateStatus) {
      data.order_status = ORDER_STATUS.FAILED_PAYMENT;
      data.cancelReason += `${cancelReasonDate} Unmatched Bank Name.\n`;
    }

    if (!orderUpdateStatus) {
      data.cancelReason += "";
    }

    try {
      const cancelReason = await connection.query(
        `UPDATE \`order\` SET cancel_reason = '${data.cancelReason}', updated_at = '${today}' WHERE customer_id = ${dataQuery.customer_id} AND id=${orderDetails.id};`
      );

      if (!cancelReason) {
        throw { message: "Cancel Reason not update." };
      }
    } catch (error) {
      console.log("error at cancel reason==>", error);
    }

    try {
      if (orderUpdateStatus) {
        const newResponse = await connection.query(
          `INSERT into payment (referenceNumber,customer_id,instantPayAmount,type,attempt,${data.responseDateTime},bankId, bankCode, bankName,created_at,${data.response}, status) VALUE ('${params.fpx_sellerOrderNo}',${dataQuery.customer_id},${dataQuery.instantPayAmount},'${data.type}',1,'${today}',${dataQuery.bankId},'${dataQuery.bankCode}','${dataQuery.bankName}','${today}','${data.respondData}',${data.status})`
        );

        if (!newResponse) {
          throw { message: "Response cannot be saved." };
        }
      }
    } catch (error) {
      console.log("Error at payment insert==>", error);
    }

    console.log("orderUpdateStatus==>", orderUpdateStatus);

    if (orderUpdateStatus) {
      try {
        const updateOrder = await connection.query(
          `UPDATE \`order\` SET order_status_id = ${data.order_status}, updated_at = '${today}' WHERE customer_id = ${dataQuery.customer_id}`
        );

        if (!updateOrder) {
          throw { message: "Order not update." };
        }
      } catch (error) {
        console.log("Update order==>", error);
      }
    }

    data.paymentCheck = 2;
    data.emailSend = "store_fail";
    data.custStatus = "cust_fail";

    if (data.status == 1 && data.order_status != ORDER_STATUS.CANCELLED && data.orderUpdateStatus != ORDER_STATUS.FAILED_PAYMENT && orderUpdateStatus) {
      data.paymentCheck = 1;
      data.emailSend = "store_pass";
      data.custStatus = "cust_pass";
    }

    if (orderUpdateStatus) {
      try {
        const customerChecks = await connection.query(
          `UPDATE spider.customer_checks SET ${data.checkPayment} = ${data.paymentCheck}, ${data.checkPaymentDate} = '${today}', curlec_refno ='${params.fpx_sellerOrderNo}' WHERE customer_id = ${dataQuery.customer_id}`
        );

        if (!customerChecks) {
          throw false;
        }
      } catch (error) {
        console.log("error at customer checks==>", error);
      }
    }

    try {
      const url = `${process.env.curlec_callback_url}`;

      let description = "";

      //params.fpx_description

      if (params.fpx_description) {
        description = params.fpx_description;
      }

      /**
       * The reason to remove from email for Instant-Pay Process can be refered to  Ticket VMS-M7Q-1JL8 on HelpDesk.
       */

      const email = dataQuery.email.toString();

      const resp = await axios({
        url,
        method: "post",
        data: qs.stringify({
          curlec_method: req.body.curlec_method,
          fpx_fpxTxnId: req.body.fpx_fpxTxnId,
          fpx_sellerExOrderNo: req.body.fpx_sellerExOrderNo,
          fpx_fpxTxnTime: req.body.fpx_fpxTxnTime,
          fpx_sellerOrderNo: req.body.fpx_sellerOrderNo,
          fpx_sellerId: req.body.fpx_sellerId,
          fpx_txnCurrency: req.body.fpx_txnCurrency,
          fpx_txnAmount: req.body.fpx_txnAmount,
          fpx_buyerName: req.body.fpx_buyerName,
          fpx_buyerBankId: req.body.fpx_buyerBankId,
          fpx_debitAuthCode: req.body.fpx_debitAuthCode,
          fpx_type: req.body.fpx_type,
          fpx_notes: email,
          fpx_description: description,
        }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      });

      if (resp) {
        if (
          resp.data ==
            "Customer data received in AR system and created customer successfully" ||
          resp.data == "Payment made and invoice status updated"
        ) {
          console.log("Success Sending API");
        } else {
          console.log(resp.data);
          console.log("Failed");
        }
      }

      const newCreateAR = await connection.query(
        `INSERT into payment (referenceNumber,customer_id,instantPayAmount,type,attempt,${
          data.responseDateTime
        },bankId, bankCode, bankName,created_at,${data.response}, status,${
          data.request
        },${data.requestDateTime}) VALUE ('${params.fpx_sellerOrderNo}',${
          dataQuery.customer_id
        },${dataQuery.instantPayAmount},'createAR',1,'${today}',${
          dataQuery.bankId
        },'${dataQuery.bankCode}','${
          dataQuery.bankName
        }','${today}','${resp.data.replace(/['"]/g, "")}',${
          data.status
        },'${qs.stringify({
          curlec_method: req.body.curlec_method,
          fpx_fpxTxnId: req.body.fpx_fpxTnxId,
          fpx_sellerExOrderNo: req.body.fpx_sellerExOrderNo,
          fpx_fpxTxnTime: req.body.fpx_fpxTxnTime,
          fpx_sellerOrderNo: req.body.fpx_sellerOrderNo,
          fpx_sellerId: req.body.fpx_sellerId,
          fpx_txnCurrency: req.body.fpx_txnCurrency,
          fpx_txnAmount: req.body.fpx_txnAmount,
          fpx_buyerName: req.body.fpx_buyerName,
          fpx_buyerBankId: req.body.fpx_buyerBankId,
          fpx_debitAuthCode: req.body.fpx_debitAuthCode,
          fpx_type: req.body.fpx_type,
          fpx_notes: email,
        })}','${today}');`
      );
    } catch (error) {
      console.log(error);
      console.log("AR Not Create");
    }

    if (orderUpdateStatus) {
      try {
        const hash = crypto
          .createHash("md5")
          .update(`${process.env.secret_key}${orderDetails.id}`)
          .digest("hex");

        const url = `${process.env.BACKEND_RENEWPLUS}/api/check/curlect/${orderDetails.id}/${hash}`;

        if (
          data.order_status != 4 &&
          data.order_status != 8 &&
          orderUpdateStatus
        ) {
          const resp1 = await axios({
            url,
            method: "get",
          });
          //console.log("backend.renewplus.my==>",resp1);
        }
      } catch (error) {
        console.log("Link redirect to update==>", error);
      }
    }

    // const emailSend = await connection.query(
    //   `INSERT INTO spider.email_send (type, status, respon, order_id, created_at) VALUES ('${data.emailSend}', '', '', ${orderDetails.id}, '${today}'),('${data.custStatus}', '', '', ${orderDetails.id}, '${today}')`
    // );

    // if (!emailSend) {
    //   throw false;
    // }

    /*const history_status = await connection.query(
      `INSERT INTO spider.history_status (by, status_id, created_at, updated_at, order_id) VALUES ('System', ${data.order_status},'${today}','${today}',${orderDetails.id})`
    );

    if (!history_status) {
      throw false;
    }*/

    /*const customerDraf = await connection.query(
      `UPDATE spider.customer SET draf = ${data.paymentCheck}, payment_check_date = '${today}' WHERE customer_id = ${dataQuery.customer_id}`
    );

    if (!customerDraf) {
      throw false;
    }*/
  } catch (error) {
    console.log(error);
  }

  return res.status(200).send("OK");
};

/**
 * order_status: 8 =>Mandate_sucess
 * order_status: 9 =>Mandate_failed
 */

exports.getMandate = async (req, res, next) => {
  const data = {
    title: "Renew Plus Mandate Status",
    status: "Authorization Failed!",
    msg: `Payment unsuccessful. Kindly ensure the bank details is correct and have sufficient balance in order to retry.`,
    url: `${process.env.renew_plus_url}/customer/create/auth/`,
    //image: images.image.failedGif,
    //logo: images.image.logo,
    image: configVariable.failed,
    logo: configVariable.logo,
    footer: `For any enquiries, kindly contact the ReNew+ team at renew.plus@compasia.com`,
    order_status: 9,
    status_respond: 0,
    button: true,
    secondAttemptUrl: "",
    referenceNumber: "",
    renewPlusRedirectCallbackUrl: "",
  };

  let page = "mandate";
  let status = false;

  try {
    let params = new URLSearchParams(req.query);

    const today = new Date().toISOString();

    const authCode = params.get("fpx_debitAuthCode").toString();

    let dataQuery;

    dataQuery = await connection.getrow(
      `select p.*,c.*,o.* from payment p
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN  \`order\` o ON c.id = o.customer_id
      where p.referenceNumber='${params.get("fpx_sellerOrderNo")}'`
    );

    params.set("name", dataQuery.first_name);
    params.set("customer_id", dataQuery.customer_id);
    params.set("timestamp", Date.now());

    logger.info(params);

    if (!dataQuery) {
      throw { message: "dataQuery" };
    }

    const orderDetails = await connection.getrow(
      `select * from \`order\` where orderId= '${dataQuery.orderId}'`
    );

    if (!orderDetails) {
      throw { message: "orderDetails" };
    }

    // const checkSession = await this.checkSession(dataQuery.customer_id);

    // if (!checkSession) {
    //   data.msg = "Session Expired. Please try again.";
    //   data.button = false;
    //   throw "Session Expired. Please try again.";
    // }

    const hash = crypto
      .createHash("md5")
      .update(`${process.env.secret_key}${orderDetails.id}`)
      .digest("hex");
    data.url = `${process.env.renew_plus_url}/customer/create/auth/${orderDetails.id}/${hash}?status=${status}`;
    data.renewPlusRedirectCallbackUrl = `${process.env.BACKEND_RENEWPLUS}/api/customer/update_customer_process?id=${orderDetails.id}`;

    data.secondAttemptUrl = `${
      process.env.domain
    }${mountAPI}/secondAttempt?referenceNumber=${params.get(
      "fpx_sellerOrderNo"
    )}`;

    data.referenceNumber = params.get("fpx_sellerOrderNo");

    const respond = JSON.stringify(req.query).replace(/'/g, '"');

    const getStatus = this.defineResponsePayment(authCode);

    const amount = dataQuery.instantPayAmount.toFixed(2);

    if (configVariable.compareName) {
      const checkName = await this.compareName(
        `${dataQuery.name_as_per_nric}`,
        params.get("fpx_buyerName"),
        dataQuery.customer_id
      );

      if (!checkName) {
        data.msg += " Please make sure that you use your bank account.";
        throw { message: "Name not same." };
      }
    }

    //Mandate
    if (!params.get("fpx_description")) {
      page = "mandate";

      if (authCode == "00") {
        const merchantUrl = `${process.env.domain}${mountAPI}/instantPay`;

        const merchantCallbackUrl = `${process.env.domain}${mountAPI}/merchantCallBackUrl`;

        const email = dataQuery.email.toString().trim();

        data.status = "Authorization Success!";

        const checksumBody = this.createUrlParam({
          orderNo: params.get("fpx_sellerOrderNo"),
          //email,
          description,
          amount,
          bankCode: dataQuery.bankCode,
          merchantId: process.env.merchant_id,
          employeeId: process.env.employee_id,
          method: "03",
          merchantUrl,
          merchantCallbackUrl,
        });

        const urlBody = "/new-instant-pay?" + checksumBody;

        //const urlBody = `/new-instant-pay?orderNo=${params.get("fpx_sellerOrderNo")}&email=${email}&description=${description}&amount=${amount}&bankCode=${dataQuery.bankCode}&merchantId=${process.env.merchant_id}&employeeId=${process.env.employee_id}&method=03&merchantUrl=${merchantUrl}&merchantCallbackUrl=${merchantCallBackUrl}`.trim();

        const checksum = this.hashSHA256(
          `${process.env.curlec_checksum}|${urlBody}`
        );

        if (!checksum.status) {
          throw { message: "Unable to Proceed to Next Payment." };
        }

        const checksumParam = configVariable.checksum
          ? `&checksum=${checksum.value}`
          : "";

        data.url = encodeURI(
          `${process.env.curlec_url}${urlBody}${checksumParam}`
        );

        console.log("Compare==>", `${process.env.curlec_checksum}|${urlBody}`);
        console.log("URL==>", data.url);
        data.msg =
          "Successful authorization. RM1.00 pre-authorization fee has been successfully deducted from your account. Please wait while we direct you to your online banking website to continue with the transaction. Please ensure the bank account you will be directed is the account you registered under the eMandate.";
        //data.image = images.image.successGif;
        data.image = configVariable.sucess;
        data.footer = `Please wait while we are redirecting you to your online banking website to continue with the transaction within 60 seconds.`;
        data.order_status = 8;
        data.status_respond = 1;
        data.button = false;

        data.request = "requestInstantPay";
        data.requestDateTime = "requestDateTimeInstantPay";
        data.type = "requestInstantPay";

        try {
          const newResponse = await connection.query(
            `INSERT into payment (referenceNumber,customer_id,instantPayAmount,type,attempt,${
              data.requestDateTime
            },bankId, bankCode, bankName,created_at,${
              data.request
            }, status) VALUE ('${params.get("fpx_sellerOrderNo")}',${
              dataQuery.customer_id
            },${dataQuery.instantPayAmount},'${data.type}',1,'${today}',${
              dataQuery.bankId
            },'${dataQuery.bankCode}','${dataQuery.bankName}','${today}','${
              data.url
            }',${data.status_respond})`
          );

          if (!newResponse) {
            throw { message: "Request cannot be saved." };
          }
        } catch (error) {
          console.log(error);
          console.log("Cannot update request Instant Pay");
        }
      }
    }

    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );

    return res.render(page, data);
  } catch (error) {
    console.log(error);
    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );

    return res.render(page, data);
  }
};

exports.secondAttemptView = async (req, res, next) => {
  const data = {
    title: "Renew Plus Mandate Status",
    status: "Authorization Failed!",
    msg: `We’re sorry! Unfortunately, your application for the ReNew+ Subscription Program is unsuccessful due to insufficient funds or incorrect account details. Please ensure your account has sufficient funds and you may then proceed to resubmit your application again.`,
    url: `${process.env.renew_plus_url}/customer/create/auth/`,
    image: configVariable.failed,
    footer: `Thank you. For any enquiries, kindly contact the ReNew+ team at renew.plus@compasia.com`,
    order_status: 9,
    status_respond: 0,
    button: true,
    secondAttemptUrl: "",
    referenceNumber: "",
    logo: configVariable.logo,
  };

  let page = "secondAttemptMandate";
  let status = false;

  try {
    let params = new URLSearchParams(req.query);

    const today = new Date().toISOString();

    let authCode;

    let dataQuery;

    dataQuery = await connection.getrow(
      `select p.*,c.*,o.* from payment p
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN  \`order\` o ON c.id = o.customer_id
      where p.referenceNumber='${params.get("fpx_sellerOrderNo")}'`
    );

    params.set("name", dataQuery.first_name);
    params.set("customer_id", dataQuery.customer_id);
    params.set("timestamp", Date.now());

    logger.info(params);

    if (!dataQuery) {
      throw { message: "dataQuery" };
    }

    const orderDetails = await connection.getrow(
      `select * from \`order\` where orderId= '${dataQuery.orderId}'`
    );

    if (!orderDetails) {
      throw { message: "orderDetails" };
    }

    // const checkSession = await this.checkSession(dataQuery.customer_id);

    // if (!checkSession) {
    //   data.msg = "Session Expired. Please try again.";
    //   data.button = false;
    //   throw "Session Expired. Please try again.";
    // }

    const hash = crypto
      .createHash("md5")
      .update(`${process.env.secret_key}${orderDetails.id}`)
      .digest("hex");
    data.url = `${process.env.renew_plus_url}/customer/create/auth/${orderDetails.id}/${hash}?status=${status}`;

    data.secondAttemptUrl = `${
      process.env.domain
    }${mountAPI}/secondAttempt?referenceNumber=${params.get(
      "fpx_sellerOrderNo"
    )}`;

    data.referenceNumber = params.get("fpx_sellerOrderNo");

    const respond = JSON.stringify(req.query).replace(/'/g, '"');
    const amount = dataQuery.instantPayAmount.toFixed(2);

    if (configVariable.compareName) {
      const compareName = await this.compareName(
        `${dataQuery.name_as_per_nric}`,
        params.get("fpx_buyerName"),
        dataQuery.customer_id
      );

      if (!compareName) {
        data.msg += "Please make sure that you use your bank account.";
        throw { message: "Name not same" };
      }
    }

    //Mandate
    if (!params.get("fpx_description")) {
      authCode = params.get("fpx_debitAuthCode").toString();
      page = "secondAttemptMandate";

      if (authCode == "00") {
        data.status = "Authorization Success!";

        const merchantUrl = `${process.env.domain}${mountAPI}/instantPay`;

        const merchantCallbackUrl = `${process.env.domain}${mountAPI}/merchantCallBackUrl`;

        const email = dataQuery.email.toString().trim();

        const checksumBody = this.createUrlParam({
          orderNo: params.get("fpx_sellerOrderNo"),
          //email,
          description,
          amount,
          bankCode: dataQuery.bankCode,
          merchantId: process.env.merchant_id,
          employeeId: process.env.employee_id,
          method: "03",
          merchantUrl,
          merchantCallbackUrl,
        });

        const urlBody = "/new-instant-pay?" + checksumBody;
        //const urlBody = `/new-instant-pay?orderNo=${params.get("fpx_sellerOrderNo")}&email=${email}&description=${description}&amount=${amount}&bankCode=${dataQuery.bankCode}&merchantId=${process.env.merchant_id}&employeeId=${process.env.employee_id}&method=03&merchantUrl=${merchantURL}&merchantCallbackUrl=${merchantCallBackURL}`.trim();

        const checksum = this.hashSHA256(
          `${process.env.curlec_checksum}|${urlBody}`
        );

        if (!checksum.status) {
          throw { message: "Unable to Proceed to Next Payment." };
        }

        const checksumParam = configVariable.checksum
          ? `&checksum=${checksum.value}`
          : "";

        data.url = encodeURI(
          `${process.env.curlec_url}${urlBody}${checksumParam}`
        );

        console.log("Compare==>", `${process.env.curlec_checksum}|${urlBody}`);
        console.log("URL==>", data.url);

        data.msg =
          "Successful authorization. RM1.00 pre-authorization fee has been successfully deducted from your account. Please wait while we direct you to your online banking website to continue with the transaction. Please ensure the bank account you will be directed is the account you registered under the eMandate.";
        data.image = configVariable.sucess;
        data.footer = `Please wait while we are redirecting you to your online banking website to continue with the transaction within 60 seconds.`;
        data.order_status = 8;
        data.status_respond = 1;
        data.button = false;

        data.request = "requestInstantPay";
        data.requestDateTime = "requestDateTimeInstantPay";
        data.type = "requestInstantPay";

        try {
          const newResponse = await connection.query(
            `INSERT into payment (referenceNumber,customer_id,instantPayAmount,type,attempt,${
              data.requestDateTime
            },bankId, bankCode, bankName,created_at,${
              data.request
            }, status) VALUE ('${params.get("fpx_sellerOrderNo")}',${
              dataQuery.customer_id
            },${dataQuery.instantPayAmount},'${data.type}',1,'${today}',${
              dataQuery.bankId
            },'${dataQuery.bankCode}','${dataQuery.bankName}','${today}','${
              data.url
            }',${data.status_respond})`
          );

          if (!newResponse) {
            throw { message: "Request cannot be saved." };
          }
        } catch (error) {
          console.log("Cannot update request Instant Pay");
        }
      }
    }

    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );

    return res.render(page, data);
  } catch (error) {
    console.log(error);
    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );

    return res.render(page, data);
  }
};

exports.generatePaymentLink = async (req, res, next) => {
  let forceBypassRequestMandateAttempt = false;
  let forceBypassSession = false;

  try {
    if (!req.body) {
      throw res.status(400).send("Please Send with Correct Format");
    }

    const { error } = generatePaymentLinkValidation.validate(req.body);

    if (error) {
      throw res.status(400).send(error.details);
    }

    if (req.body.forceBypassRequestMandateAttempt === true) {
      forceBypassRequestMandateAttempt = true;
    }

    if (req.body.forceBypassSession === true) {
      forceBypassSession = true;
    }

    let attempt = 1;
    let page = "mandate";
    let requestMandateStatus = true;

    const getRequestMandate = await connection.getrow(
      `SELECT * FROM payment where type='requestMandatePayment' AND customer_id=${req.body.customerId} ORDER BY id DESC;`
    );

    if (getRequestMandate) {
      if (!forceBypassRequestMandateAttempt && getRequestMandate.attempt >= 5) {
        throw "Cannot proceed because try more than 5 times for E-Mandate.";
      }

      page = "secondAttempt";
      attempt = getRequestMandate.attempt + 1;
    }

    const today = new Date().toISOString();
    const data = await connection.getrow(
      `select c.*,o.* from \`order\` o  LEFT JOIN customer c  ON o.customer_id = c.id where o.customer_id = ${req.body.customerId}`
    );

    if (!data) {
      throw "Data not exist";
    }

    req.body.amount = parseFloat(req.body.amount).toFixed(2);

    const details = encodeURI(
      JSON.stringify([
        {
          detailsNumber: data.orderId,
          detailsDescription: `${data.first_name} ${data.last_name}`,
          detailsAmount: `${req.body.amount}`,
        },
      ])
    );

    const bankList = await this.bankListing();

    if (!bankList) {
      throw `Problem when getting bank list.`;
    }

    const bankDetails = _.head(bankList);
    let bankDetail = {};

    for (var i = 0; i < bankDetails.length; i++) {
      if (req.body.bankId == _.head(bankDetails[i].id)) {
        bankDetail = bankDetails[i];
        break;
      }
    }

    if (JSON.stringify(bankDetail) == "{}") {
      throw `Bank ID Not Exist`;
    }

    const customerDetails = {
      nric: data.nric,
      tempId: data.temp_id,
    };

    const checkNric = await this.checkNric(customerDetails);

    if (!checkNric.flag) {
      throw checkNric.reason;
    }

    if(!forceBypassSession) {

      const checkSession = await this.checkSession(req.body.customerId);

      if (!checkSession) {
        throw "Session Expired. Please try again.";
      }
    }

    const referenceNumber = await this.generateReferenceNumber();

    const name = data.name_as_per_nric
      .toString()
      .substring(0, 40)
      .replace(/'/g, '"')
      .trim();
    const email = data.email.toString().trim();
    const amount = parseFloat(req.body.amount).toFixed(2);

    const merchantUrl = `${`${process.env.domain}${mountAPI}/${page}`}`;
    const merchantCallbackUrl = `${`${process.env.domain}${mountAPI}/merchantCallBackUrl`}`;

    const checksumBody = this.createUrlParam({
      referenceNumber,
      effectiveDate: req.body.effectiveDate,
      amount,
      frequency: "MONTHLY",
      maximumFrequency: 99,
      purposeOfPayment: "Loans",
      businessModel: "B2C",
      name,
      emailAddress: email,
      idType: "NRIC",
      idValue: data.nric,
      bankId: req.body.bankId,
      linkId: "Notes",
      merchantId: process.env.merchant_id,
      employeeId: process.env.employee_id,
      method: "03",
      merchantUrl,
      merchantCallbackUrl,
    });

    const urlBody = "/new-mandate?" + checksumBody;

    /*
    const urlBody =
      `/new-mandate?referenceNumber=${referenceNumber}&effectiveDate=${req.body.effectiveDate}&expiryDate=&amount=${amount}&frequency=MONTHLY&maximumFrequency=99&purposeOfPayment=Loans&businessModel=B2C&name=${name}&emailAddress=${email}&phoneNumber=&idType=NRIC&idValue=${data.nric}&bankId=${req.body.bankId}&linkId=Notes&merchantId=${process.env.merchant_id}&employeeId=${process.env.employee_id}&method=03&details=&merchantUrl=${merchantUrl}&merchantCallbackUrl=${merchantCallBackUrl}`.trim();

      */
    const checksum = this.hashSHA256(
      `${process.env.curlec_checksum}|${urlBody}`
    );

    if (!checksum.status) {
      throw "Unable to Proceed to Next Payment.";
    }

    /**
     * This to help the readiness if Curlec Delay on to implement Checksum.
     * Will Remove once Curlec ready on Checksum feature.
     */
    const checksumParam = configVariable.checksum
      ? `&checksum=${checksum.value}`
      : "";

    let requestMandate = encodeURI(
      `${process.env.curlec_url}${urlBody}${checksumParam}`
    ).trim();

    //requestMandate = requestMandate.replace(/'/g, '"');

    const newMandate = await connection.query(
      `INSERT into payment (referenceNumber,customer_id,instantPayAmount,type,attempt,requestTimeDateMandate,bankId, bankCode, bankName,created_at,requestMandate,status) VALUE ('${referenceNumber}',${
        req.body.customerId
      },${req.body.amount},'mandate',${attempt},'${today}',${_.head(
        bankDetail.id
      )},'${_.head(bankDetail.code)}','${_.head(
        bankDetail.name
      )}','${today}','${requestMandate}',1)`
    );

    if (!newMandate) {
      throw `Save request failed`;
    }

    if (requestMandateStatus) {
      const newRequestPayment = await connection.query(
        `INSERT into payment (referenceNumber,customer_id,instantPayAmount,type,attempt,requestTimeDateMandate,bankId, bankCode, bankName,created_at,requestMandate,status) VALUE ('${referenceNumber}',${
          req.body.customerId
        },${
          req.body.amount
        },'requestMandatePayment',${attempt},'${today}',${_.head(
          bankDetail.id
        )},'${_.head(bankDetail.code)}','${_.head(
          bankDetail.name
        )}','${today}','${JSON.stringify(req.body)}',1)`
      );

      if (!newRequestPayment) {
        throw `Save request Payment failed`;
      }
    }

    return res.status(200).json({
      url: requestMandate,
      message: `Customer exist. Proceed to Mandate Payment.`,
    });
  } catch (error) {
    console.log(error);
    if (error.message) return res.status(400).json({ message: error.message });

    return res.status(400).json({ message: error });
  }
};

exports.secondAttempt = async (req, res, next) => {
  try {
    if (!req.query) {
      throw { status: 400, message: "No Data." };
    }

    const params = new URLSearchParams(req.query);
    const today = new Date().toISOString();

    if (!params.get("referenceNumber")) {
      throw { status: 400, message: "No Reference Number." };
    }

    const dataQuery = await connection.getrow(
      `select p.*,c.*,o.* from payment p
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN  \`order\` o ON c.id = o.customer_id
      where p.referenceNumber='${params.get("referenceNumber")}'`
    );

    if (!dataQuery) {
      throw { status: 400, message: "No Data For Reference Number." };
    }

    const getRequestMandate = await connection.getrow(
      `SELECT * FROM payment where type='requestMandatePayment' AND customer_id=${
        dataQuery.customer_id
      } AND referenceNumber='${params.get(
        "referenceNumber"
      )}' ORDER BY id DESC;`
    );

    if (!getRequestMandate) {
      throw { status: 400, message: "No Record For Tracking Payment." };
    }

    const referenceNumber = await this.generateReferenceNumber();

    if (!referenceNumber) {
      throw { status: 400, message: "Cannot Generate Reference Number." };
    }

    const requestMandateValue = JSON.parse(getRequestMandate.requestMandate);

    const orderDetails = await connection.getrow(
      `select * from \`order\` where orderId= '${dataQuery.orderId}'`
    );

    if (!orderDetails) {
      throw { status: 400, message: "Order Not Found" };
    }

    const details = encodeURI(
      JSON.stringify([
        {
          detailsNumber: orderDetails.id,
          detailsDescription:
            `${dataQuery.first_name} ${dataQuery.last_name}`.trim(),
          detailsAmount: `${requestMandateValue.amount}`,
        },
      ])
    );

    const tempInfo = await connection.getrow(
      `select * from temporary_info where id=${dataQuery.temp_id}`
    );

    if (!tempInfo) {
      throw { status: 400, message: "No Data For Temporary ID." };
    }
    //`${process.env.renew_plus_url}/customer/create/${tempInfo.id}/${tempInfo.hashvalue}`.trim();
    const requestMandate =
      `${process.env.renew_plus_url}/customer/bank/${tempInfo.id}/${tempInfo.hashvalue}`.trim();

    return res
      .status(200)
      .json({ url: requestMandate, message: `Let's Go!!!` });
  } catch (error) {
    return res.status(error.status).json(error);
  }
};

exports.generateReferenceNumber = async () => {
  const referenceNumber = `${randomstring.generate({
    length: 3,
    charset: "alphabetic",
  })}-${randomstring.generate({
    length: 3,
    charset: "alphabetic",
  })}-${randomstring.generate({ length: 3, charset: "alphabetic" })}`;

  const checkRefNo = await connection.getrow(
    `SELECT COUNT(id) FROM payment where referenceNumber = '${referenceNumber}';`
  );

  if (checkRefNo > 1) {
    this.generateReferenceNumber();
  }

  return referenceNumber;
};

// exports.testReport = async (req, res, next) => {
//   var status = ["approved", "failed"];
//   var randomStatus = Math.floor(Math.random() * status.length);
//   // console.log(status[randomStatus]);

//   return res.status(200).json({
//     status: "approved",
//   });
// };

exports.compareName = async (
  customerName,
  buyerName,
  customerId,
  page = true
) => {
  try {
    const today = new Date().toISOString();

    const title = [
      "mr",
      "mrs",
      "ms",
      "sir",
      "madam",
      "encik",
      "cik",
      "en",
      "pn",
      "tuan",
      "puan",
      "haji",
      "hajjah",
    ];

    // console.log(" decodeURI(buyerName)", (decodeURIComponent(buyerName)));
    let buyerNameCap = decodeURIComponent(buyerName)
      .toLowerCase()
      .replace(/[&\/\\#,+()$~%.'":*?<>{} -@]/g, " ")
      .trim();

    const buyerNameCapSplit = buyerNameCap.split(" ");
    const joinArrayName = [];

    buyerNameCapSplit.map((word) => {
      if (title.indexOf(word) == -1) {
        joinArrayName.push(word);
      }
    });

    buyerNameCap = joinArrayName.join("");
    buyerNameCap = buyerNameCap.trim();

    const capCharachter = buyerNameCap.length;

    const customerNameCap = customerName
      .replace(/[&\/\\#,+()$~%.'":*?<>{} -@]/g, "")
      .toLowerCase()
      .slice(0, capCharachter)
      .trim();

    console.log("customerName==>", customerName);
    console.log("customerNameCap==>", customerNameCap);
    console.log("buyerName=>", buyerName);
    console.log("buyerNameCap==>", buyerNameCap);

    const similarityPercentageScore =
      parseFloat(this.similarity(customerNameCap, buyerNameCap)).toFixed(2) *
      100;

    let percentage = 80;

    try {
      const config = await connection.getrow(
        `select * from config
          where type= 'similarity'`
      );

      if (!config) {
        throw "Error Getting Percentage Similarity";
      }

      percentage = parseFloat(config.value).toFixed(2);
    } catch (error) {
      console.log("Similarity Compare==>", error);
    }

    const compareName = JSON.stringify({
      customerName,
      customerNameCap,
      buyerName,
      buyerNameCap,
      percentage,
      similarityPercentageScore,
    }).replace(/'/g, '"');

    //Only Merchant Callback URL will record this action. From Merchant URL will ignore this action.
    if (!page) {
      const compareNameEvent = await connection.query(
        `INSERT into payment (customer_id,instantPayAmount,type,attempt,requestTimeDateMandate,bankId, bankCode, bankName,created_at,requestMandate,status) VALUE (${customerId},1,'compareNameEvent',1,'${today}',1,'1','1
      ','${today}','${compareName}',1)`
      );
    }

    if (similarityPercentageScore >= percentage) {
      return true;
    } else {
      return false;
    }

    /*if (customerNameCap == buyerNameCap) {
      return true;
    } else {
      return false;
    }*/
  } catch (error) {
    console.log(error);
    return false;
  }
};

exports.defineResponsePayment = (responseCode) => {
  try {
    const status = {
      statusCode: "",
      statusDescription: "",
      responseCode,
    };

    switch (responseCode) {
      case "-1":
        status.statusCode = "AWAITING_FPX_AUTHORISATION";
        status.statusDescription = "Awaiting FPX Authorisation.";
        break;
      case "-2":
        status.statusCode = "AWAITING_FPX_TERMINATION";
        status.statusDescription = "Awaiting FPX termination.";
        break;
      case "-3":
        status.statusCode = "NEW";
        status.statusDescription = "New.";
        break;
      case "-4":
        status.statusCode = "TERMINATED";
        status.statusDescription = "Terminated.";
        break;

      case "03":
        status.statusCode = "INVALID_MERCHANT";
        status.statusDescription = "Invalid Merchant.";
        break;

      case "05":
        status.statusCode = "INVALID_SELLER_OR_ACQUIRING_BANK_CODE";
        status.statusDescription = "Invalid Seller or Acquiring Bank Code.";
        break;

      case "00":
        status.statusCode = "APPROVED";
        status.statusDescription = "";
        break;

      case "09":
        status.statusCode = "TRANSACTION_PENDING";
        status.statusDescription = "Transaction Pending.";
        break;

      case "12":
        status.statusCode = "INVALID_TRANSACTION";
        status.statusDescription = "Invalid Transaction.";
        break;

      case "13":
        status.statusCode = "INVALID_AMOUNT";
        status.statusDescription = "Invalid Amount.";
        break;

      case "14":
        status.statusCode = "INVALID_BUYER_ACCOUNT";
        status.statusDescription = "Invalid Buyer Account.";
        break;

      case "20":
        status.statusCode = "INVALID_RESPONSE";
        status.statusDescription = "Invalid Response.";
        break;

      case "30":
        status.statusCode = "FORMAT_ERROR";
        status.statusDescription = "Format Error.";
        break;

      case "31":
        status.statusCode = "INVALID_BANK";
        status.statusDescription = "Invalid Bank.";
        break;

      case "39":
        status.statusCode = "NO_CREDIT_ACCOUNT";
        status.statusDescription = "No Credit Account.";
        break;

      case "45":
        status.statusCode = "DUPLICATE_SELLER_ORDER_NUMBER";
        status.statusDescription = "Duplicate Seller Order Number.";
        break;

      case "46":
        status.statusCode = "INVALID_SELLER_EXCHANGE_OR_SELLER";
        status.statusDescription = "Invalid Seller Exchange or Seller.";
        break;

      case "47":
        status.statusCode = "INVALID_CURRENCY";
        status.statusDescription = "Invalid Currency.";
        break;

      case "48":
        status.statusCode = "MAXIMUM_TRANSACTION_LIMIT_EXCEEDED";
        status.statusDescription = "Maximum Transaction Limit Exceeded.";
        break;

      case "49":
        status.statusCode = "MERCHANT_SPECIFIC_LIMIT_EXCEEDED";
        status.statusDescription = "Merchant Specific Limit Exceeded.";
        break;

      case "50":
        status.statusCode = "INVALID_SELLER_FOR_MERCHANT_SPECIFIC_LIMIT";
        status.statusDescription =
          "Invalid Seller for Merchant Specific Limit.";
        break;

      case "51":
        status.statusCode = "INSUFFICIENT_FUNDS";
        status.statusDescription = "Insufficient Funds.";
        break;

      case "53":
        status.statusCode = "NO_BUYER_ACCOUNT_NUMBER";
        status.statusDescription = "No Buyer Account Number.";
        break;

      case "57":
        status.statusCode = "TRANSACTION_NOT_PERMITTED";
        status.statusDescription = "Transaction Not Permitted.";
        break;

      case "58":
        status.statusCode = "TRANSACTION_TO_MERCHANT_NOT_PERMITTED";
        status.statusDescription = "Transaction To Merchant Not Permitted.";
        break;

      case "70":
        status.statusCode = "INVALID_SERIAL_NUMBER";
        status.statusDescription = "Invalid Serial Number.";
        break;

      case "76":
        status.statusCode = "TRANSACTION_NOT_FOUND";
        status.statusDescription = "Transaction Not Found.";
        break;

      case "77":
        status.statusCode = "INVALID_BUYER_NAME_OR_BUYER_ID";
        status.statusDescription = "Invalid Buyer Name or Buyer ID.";
        break;

      case "78":
        status.statusCode = "DECRYPTION_FAILED";
        status.statusDescription = "Decryption Failed.";
        break;

      case "79":
        status.statusCode = "HOST_DECLINE_WHEN_DOWN";
        status.statusDescription = "Host Decline When Down.";
        break;

      case "80":
        status.statusCode = "BUYER_CANCEL_TRANSACTION";
        status.statusDescription = "Buyer Cancel Transaction.";
        break;

      case "83":
        status.statusCode = "INVALID_TRANSACTION_MODEL";
        status.statusDescription = "Invalid Transaction Model.";
        break;

      case "84":
        status.statusCode = "INVALID_TRANSACTION_TYPE";
        status.statusDescription = "Invalid Transaction Type.";
        break;

      case "85":
        status.statusCode = "INTERNAL_ERROR_AT_BANK_SYSTEM";
        status.statusDescription = "Internal Error At Bank System.";
        break;

      case "87":
        status.statusCode = "DEBIT_FAILED_EXCEPTION_HANDLING";
        status.statusDescription = "Debit Failed Exception Handling.";
        break;

      case "88":
        status.statusCode = "CREDIT_FAILED_EXCEPTION_HANDLING";
        status.statusDescription = "Credit Failed Exception Handling.";
        break;

      case "89":
        status.statusCode = "TRANSACTION_NOT_RECEIVED_EXCEPTION_HANDLING";
        status.statusDescription =
          "Transaction Not Received Exception Handling.";
        break;

      case "90":
        status.statusCode = "BANK_INTERNET_BANKING_UNAVAILABLE";
        status.statusDescription = "Bank Internet Banking Unavailable.";
        break;

      case "92":
        status.statusCode = "INVALID_BUYER_BANK_96_SYSTEM_MALFUNCTION";
        status.statusDescription = "Invalid Buyer Bank 96 System Malfunction.";
        break;

      case "98":
        status.statusCode = "PENDING_AUTHORISATION_B2B";
        status.statusDescription =
          "Pending Authorisation (Applicable for B2B Model).";
        break;

      case "99":
        status.statusCode = "PENDING_AUTHORISATION_B2B";
        status.statusDescription =
          "Pending Authorisation (Applicable for B2B Model).";
        break;

      case "BB":
        status.statusCode = "BLOCKED_BANK";
        status.statusDescription = "Blocked Bank.";
        break;

      case "BC":
        status.statusCode = "TRANSACTION_CANCELLED_BY_CUSTOMER";
        status.statusDescription = "Transaction Cancelled By Customer.";
        break;

      case "DA":
        status.statusCode = "INVALID_APPLICATION_TYPE";
        status.statusDescription = "Invalid Application Type.";
        break;

      case "DB":
        status.statusCode = "INVALID_EMAIL_FORMAT";
        status.statusDescription = "Invalid Email Format.";
        break;

      case "DC":
        status.statusCode = "INVALID_MAXIMUM_FREQUENCY";
        status.statusDescription = "Invalid Maximum Frequency.";
        break;

      case "DD":
        status.statusCode = "INVALID_FREQUENCY_MODE";
        status.statusDescription = "Invalid Frequency Mode.";
        break;

      case "DE":
        status.statusCode = "INVALID_EXPIRY_DATE";
        status.statusDescription = "Invalid Expiry Date.";
        break;

      case "DF":
        status.statusCode = "INVALID_E_MANDATE_BUYER_BANK_ID";
        status.statusDescription = "Invalid e-Mandate Buyer Bank ID.";
        break;

      case "FE":
        status.statusCode = "INTERNAL_ERROR";
        status.statusDescription = "Internal Error.";
        break;

      case "OE":
        status.statusCode =
          "TRANSACTION_REJECTED_AS_NOT_IN_FPX_OPERATING_HOURS";
        status.statusDescription =
          "Transacation Rejected As Not In FPX Operating Hours.";
        break;

      case "OF":
        status.statusCode = "TRANSACTION_TIMEOUT";
        status.statusDescription = "Transaction Timeout.";
        break;

      case "SB":
        status.statusCode = "INVALID_ACQUIRING_BANK_CODE";
        status.statusDescription = "Invalid Acquiring Bank Code.";
        break;

      case "XA":
        status.statusCode = "INVALID_SOURCE_IP_ADDRESS_B2B2B";
        status.statusDescription =
          "Invalid Source Ip Address (Applicable for B2B2 model.";
        break;

      case "XB":
        status.statusCode = "INVALID_SELLER_EXCHANGE_IP";
        status.statusDescription = "Invalid Seller Exchange IP.";
        break;

      case "XC":
        status.statusCode = "SELLER_EXCHANGE_ENCRYPTION_ERROR";
        status.statusDescription = "Seller Exchange Encryption Error.";
        break;

      case "XE":
        status.statusCode = "INVALID_MESSAGE";
        status.statusDescription = "Invalid Message.";
        break;

      case "XF":
        status.statusCode = "INVALID_NUMBER_OF_ORDERS";
        status.statusDescription = "Invalid Number Of Orders.";
        break;

      case "XI":
        status.statusCode = "INVALID_SELLER_EXCHANGE";
        status.statusDescription = "Invalid Seller Exchange.";
        break;

      case "XM":
        status.statusCode = "INVALID_FPX_TRANSACTION_MODEL";
        status.statusDescription = "Invalid FPX Transacation Model.";
        break;

      case "XN":
        status.statusCode =
          "TRANSACTION_REJECTED_DUE_TO_DUPLICATE_SELLER_EXCHANGE_ORDER_NUMBER";
        status.statusDescription =
          "Transaction Rejected Due to Duplicate Seller Exchange Order Number.";
        break;

      case "XO":
        status.statusCode = "DUPLICATE_EXCHANGE_ORDER_NUMBER";
        status.statusDescription = "Duplicate Exchange Order Number.";
        break;

      case "XS":
        status.statusCode = "SELLER_DOES_NOT_BELONG_TO_EXCHANGE";
        status.statusDescription = "Seller Does Not Belong To Exchange.";
        break;

      case "XT":
        status.statusCode = "INVALID_TRANSACTION_TYPE_XT";
        status.statusDescription = "Invalid Transaction Type.";
        break;

      case "XW":
        status.statusCode = "SELLER_EXCHANGE_DATE_DIFFERENCE_EXCEEDED";
        status.statusDescription = "Seller Exchange Date Difference Exceeded.";
        break;

      case "1A":
        status.statusCode =
          "BUYER_SESSION_TIMEOUT_AT_INTERNET_BANKING_LOGIN_PAGE";
        status.statusDescription =
          "Buyer Session Timeout At Internet Banking Login Page.";
        break;

      case "1B":
        status.statusCode =
          "BUYER_FAILED_TO_PROVIDE_THE_NECESSARY_INFO_TO_LOGIN_TO_INTERNET";
        status.statusDescription =
          "Buyer Failed To Provide The Necessary Info To Login To Internet.";
        break;

      case "1C":
        status.statusCode = "BUYER_CHOOSE_CANCEL_AT_LOGIN_PAGE";
        status.statusDescription = "Buyer Choose Cancel At Login Page.";
        break;

      case "1D":
        status.statusCode = "BUYER_SESSION_TIMEOUT_AT_ACCOUNT_SELECTION_PAGE";
        status.statusDescription =
          "Buyer Session Timeout At Account Selection Page.";
        break;

      case "1E":
        status.statusCode =
          "BUYER_FAILED_TO_PROVIDE_THE_NECESSARY_INFO_AT_ACCOUNT_SELECTION_PAGE";
        status.statusDescription =
          "Buyer Failed To Provide The Necessary Info At Account Selection Page.";
        break;

      case "1F":
        status.statusCode = "BUYER_CHOOSE_CANCEL_AT_ACCOUNT_SELECTION";
        status.statusDescription = "Buyer Choose Cancel At Account Selection.";
        break;

      case "1G":
        status.statusCode = "BUYER_SESSION_TIMEOUT_AT_TAC_REQUEST_PAGE";
        status.statusDescription = "Buyer Session Timeout At TAC Request Page.";
        break;

      case "1H":
        status.statusCode =
          "BUYER_FAILED_TO_PROVIDE_THE_NECESSARY_INFO_AT_TAC_REQUEST_PAGE";
        status.statusDescription =
          "Buyer Failed To Provide The Necessary Info At TAC Request Page.";
        break;

      case "1I":
        status.statusCode = "BUYER_CHOOSE_CANCEL_AT_TAC_REQUEST_PAGE";
        status.statusDescription = "Buyer Choose Cancel At TAC Request Page.";
        break;

      case "1J":
        status.statusCode = "BUYER_SESSION_TIMEOUT_AT_CONFIRMATION_PAGE";
        status.statusDescription =
          "Buyer Session Timeout At Confirmation Page.";
        break;

      case "1K":
        status.statusCode =
          "BUYER_FAILED_TO_PROVIDE_THE_NECESSARY_INFO_AT_CONFIRMATION_PAGE";
        status.statusDescription =
          "Buyer Failed To Provide The Necessary Info At Confirmation Page.";
        break;

      case "1L":
        status.statusCode = "BUYER_CHOOSE_CANCEL_AT_CONFIRMATION_PAGE";
        status.statusDescription = "Buyer Choose Cancel At Confirmation Page.";
        break;

      case "1M":
        status.statusCode = "INTERNET_BANKING_SESSION_TIMEOUT";
        status.statusDescription = "Internet Banking Session Timeout.";
        break;

      case "2A":
        status.statusCode = "TRANSACTION_AMOUNT_IS_LOWER_THAN_MINIMUM_LIMIT";
        status.statusDescription =
          "Transaction Amount Is Lower Than Minimum Limit.";
        break;

      case "-5":
        status.statusCode = "DRAFT";
        status.statusDescription = "Draft";
        break;

      case "OA":
        status.statusCode = "SESSION_TIMEOUT_AT_FPX_ENTRY_PAGE";
        status.statusDescription = "Session Timeout At FPX Entry Page.";
        break;

      case "2X":
        status.statusCode = "TRANSACTION_IS_CANCELLED_BY_MERCHANT";
        status.statusDescription = "Transaction Is Cancelled By Merchant.";
        break;

      case "-6":
        status.statusCode = "AWAITING_AUTHORISATION";
        status.statusDescription = "Awaiting Authorisation.";
        break;

      case "C9999":
        status.statusCode = "UNKNOWN_ERROR";
        status.statusDescription = "Unknown Error.";
        break;

      case "CRR":
        status.statusCode = "FAILED";
        status.statusDescription = "Failed/Blocked/Rejected.";
        break;

      case "X9999":
        status.statusCode = "PAPER_MANDATE_FAILED";
        status.statusDescription = "Paper Mandate Error.";
        break;

      default:
        status.statusCode = "NOT_IN_RESPONSE";
        status.statusDescription =
          "No message from Curlec. Please Contact Curlec for more information.";
        break;
    }

    return status;
  } catch (error) {
    return false;
  }
};

exports.recurringPayment = async (req, res, next) => {
  const recurringPaymentData = {
    collectionDate: moment().toDate(),
    collectionAmount: 0,
    contractPeriod: 0,
    status: "failed",
    request: "{}",
    response: "{}",
    customerId: 0,
    orderId: 0,
    referenceNumber: "",
    custIdCurlecRef: "",
  };

  const today = DateTime.fromJSDate(new Date()).toSQL();

  try {
    if (!req.body) {
      throw res.status(400).send("Please Send with Correct Format");
    }

    const { error } = recurringPaymentValidation.validate(req.body);

    if (error) {
      throw res.status(400).send(error.details);
    }

    const customerContract = await connection.getrow(
      `SELECT * FROM customer_contracts where contract_number='${req.body.contractNumber}' ORDER BY id DESC;`
    );

    if (!customerContract) {
      throw { message: "Contract cannot be found" };
    }

    recurringPaymentData.collectionDate = moment(customerContract.contract_date)
      .add(1, "M")
      .format("YYYY-MM-DD")
      .toString();
    recurringPaymentData.contractPeriod =
      parseInt(customerContract.subscription_period) - 1;
    recurringPaymentData.collectionAmount =
      customerContract.monthly_subscription;
    recurringPaymentData.customerId = customerContract.customer_id;
    recurringPaymentData.orderId = customerContract.order_id;

    const getResponseInstantPay = await connection.getrow(
      `SELECT * FROM payment where type='instant-pay' AND customer_id=${customerContract.customer_id} AND status=1 AND responseDateTimeInstantPay IS NOT NULL ORDER BY id DESC;`
    );

    if (!getResponseInstantPay) {
      throw { message: "Data Payment not exist" };
    }

    if (getResponseInstantPay.status != 1) {
      throw { message: "Payment is not Successfully on Instant Pay." };
    }

    recurringPaymentData.referenceNumber =
      getResponseInstantPay.referenceNumber;

    const paymentRecurringData = await connection.getrow(
      `SELECT * FROM payment_recurring WHERE customer_id = ${recurringPaymentData.customerId};`
    );

    if (!paymentRecurringData) {
      const insertPaymentRecurring = await connection.execute(
        `INSERT INTO payment_recurring (customer_id, order_id, cust_collection_date, cust_collection_amount, cust_contract_period, status, referenceNumber,created_at) VALUE (${
          recurringPaymentData.customerId
        }, ${recurringPaymentData.orderId},'${
          recurringPaymentData.collectionDate
        }',${parseFloat(recurringPaymentData.collectionAmount)}, ${parseFloat(
          recurringPaymentData.contractPeriod
        )},'${recurringPaymentData.status}', '${
          recurringPaymentData.referenceNumber
        }','${today}');`
      );

      if (!insertPaymentRecurring) {
        throw { message: "Cannot Insert Payment Recurring Table." };
      }
    }

    const dataQuery = await connection.getrow(
      `select p.*,c.*,o.* from payment p
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN  \`order\` o ON c.id = o.customer_id
      where p.referenceNumber='${recurringPaymentData.referenceNumber}'`
    );

    if (!dataQuery) {
      throw { message: "Customer Details Not Found." };
    }

    const orderDetails = await connection.getrow(
      `select * from \`order\` where orderId= '${dataQuery.orderId}'`
    );

    if (!orderDetails && orderDetails.id != req.body.orderId) {
      throw { message: "orderDetails" };
    }

    const token = await this.loginRecurring();

    if (!token) {
      throw { message: "Cannot Get Token" };
    }

    const accessToken = token.access ? token.access : false;

    if (!accessToken) {
      throw { message: "Cannot Get Access Token" };
    }

    const customerARDetails = await this.getCustomerIdCurlec(
      getResponseInstantPay.referenceNumber,
      accessToken
    );

    if (!customerARDetails) {
      throw { message: "Cannot Find Customer ID From AR Portal." };
    }

    recurringPaymentData.custIdCurlecRef = customerARDetails.customer_id;

    const configRecurringPayment = {
      url: `${process.env.curlec_recurring_url}/customers/${recurringPaymentData.custIdCurlecRef}/`,
      method: `PATCH`,
      data: {
        cust_collection_date: recurringPaymentData.collectionDate,
        cust_collection_amt: recurringPaymentData.collectionAmount,
        cust_contract_period: recurringPaymentData.contractPeriod,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const createRecurringPayment = await axios(configRecurringPayment)
      .then((res) => {
        return { status: true, data: res.data.message };
      })
      .catch((error) => {
        return { status: false, data: JSON.stringify(error) };
      });

    recurringPaymentData.request = JSON.stringify(configRecurringPayment.data);
    recurringPaymentData.response = createRecurringPayment.data;

    let messageRecurringPayment = "Recurring Successfully Registered.";
    let statusCode = 200;

    if (createRecurringPayment.status) {
      recurringPaymentData.status = "success";
    } else if (!createRecurringPayment.status) {
      messageRecurringPayment = "Recurring Failed To Register.";
      statusCode = 400;
    }

    const paymentRecurring = await connection.getrow(
      `SELECT * FROM payment_recurring where customer_id =${recurringPaymentData.customerId} AND order_id= ${recurringPaymentData.orderId} ORDER BY created_at DESC;`
    );

    const writePaymentRecurring = `UPDATE payment_recurring SET request = '${recurringPaymentData.request}', response = '${recurringPaymentData.response}', status = '${recurringPaymentData.status}', updated_at = '${today}', cust_id_curlec_ref = '${recurringPaymentData.custIdCurlecRef}' WHERE payment_recurring_id = ${paymentRecurring.payment_recurring_id};`;

    const writePaymentRecurringExecute = await connection.execute(
      writePaymentRecurring
    );

    if (!writePaymentRecurringExecute) {
      throw { message: "Cannot Update Into Payment Recurring." };
    }

    const recurringPaymentHistory = await connection.execute(
      `INSERT INTO payment_recurring_history (payment_recurring_id, customer_id, order_id, cust_collection_date, cust_collection_amount, cust_contract_period, status, referenceNumber,created_at, request, response, cust_id_curlec_ref) VALUE (${
        paymentRecurring.payment_recurring_id
      }, ${recurringPaymentData.customerId}, ${recurringPaymentData.orderId},'${
        recurringPaymentData.collectionDate
      }',${parseFloat(recurringPaymentData.collectionAmount)}, ${parseFloat(
        recurringPaymentData.contractPeriod
      )},'${recurringPaymentData.status}', '${
        recurringPaymentData.referenceNumber
      }','${today}', '${recurringPaymentData.request}', '${
        recurringPaymentData.response
      }','${recurringPaymentData.custIdCurlecRef}');`
    );

    return res.status(statusCode).json({
      message: messageRecurringPayment,
    });
  } catch (error) {
    console.log(error);

    if (error.message) return res.status(400).json({ message: error.message });

    return res.status(400).json({ message: JSON.stringify(error) });
  }
};

exports.cronJobRecurringPayment = async (req, res, next) => {
  try {
    const today = DateTime.fromJSDate(new Date()).toSQL();

    const paymentRecurring = await connection.getall(
      `SELECT * FROM payment_recurring where status = 'failed' ORDER BY payment_recurring_id;`
    );

    if (!paymentRecurring) {
      throw { message: "Payment Recurring Failed Fetch Data." };
    }

    const token = await this.loginRecurring();

    if (!token) {
      throw { message: "Cannot Get Token" };
    }

    const refreshToken = token.refresh ? token.refresh : false;

    if (!refreshToken) {
      throw { message: "Cannot Get Refresh Token." };
    }

    let accessToken = token.access ? token.access : false;

    if (!accessToken) {
      throw { message: "Cannot Get Access Token" };
    }

    let countRequest = 1;

    await Promise.all(
      paymentRecurring.map(async (items, index, next) => {
        try {
          console.log("index==>", index);
          if (countRequest % 10 == 0) {
            accessToken = await this.loginRefreshTokenRecurring(refreshToken);

            if (!accessToken) {
              throw "Cannot Get Access Token.";
            }
          }

          const customerID = await this.getCustomerIdCurlec(
            items.referenceNumber,
            accessToken
          );

          if (!customerID) {
            throw "Customer Cannot Be Found.";
          }

          const configRecurringPayment = {
            url: `${process.env.curlec_recurring_url}/customers/${customerID.custIdCurlecRef}/`,
            method: `PATCH`,
            data: {
              cust_collection_date: items.cust_collection_date,
              cust_collection_amount: items.cust_collection_amount,
              cust_contract_period: items.cust_contract_period,
            },
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          };

          const createRecurringPayment = await axios(configRecurringPayment)
            .then((res) => {
              return { status: true, data: res.data.message };
            })
            .catch((error) => {
              console.log(error);
              return { status: false, data: JSON.stringify(error) };
            });

          countRequest = countRequest + 1;
        } catch (error) {
          throw { message: error };
        }
      })
    );

    return res.status(200).json({
      message: `Recurring Cron Job Successfully Registered.`,
    });
  } catch (error) {
    console.log(error);

    if (error.message) return res.status(400).json({ message: error.message });

    return res.status(400).json({ message: error });
  }
};

exports.loginRecurring = async () => {
  return await axios
    .post(`${process.env.curlec_recurring_url}/token/`, {
      username: process.env.curlec_recurring_username,

      password: process.env.curlec_recurring_password,
    })
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      return false;
    });
};

exports.loginRefreshTokenRecurring = async (refresh) => {
  try {
    return await axios
      .post(`${process.env.curlec_recurring_url}/token/refresh`, {
        refresh,
      })
      .then((res) => {
        return res.data.access;
      })
      .catch((error) => {
        return false;
      });
  } catch {
    return false;
  }
};

exports.getCustomerIdCurlec = async (referenceNumber, accessToken) => {
  try {
    const payload = {
      url: `${process.env.curlec_recurring_url}/customers/get_cust_id/`,
      data: JSON.stringify({
        cust_mandate_ref: referenceNumber,
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Content-Type": "application/json",
      },
      method: "GET",
    };

    return await axios(payload)
      .then((res) => {
        return res.data;
      })
      .catch((error) => {
        console.log(error);
        return false;
      });
  } catch (error) {
    return false;
  }
};

exports.generateMandateLink = async (req, res, next) => {  
  let forceBypassRequestMandateAttempt = false;
  let forceBypassSession = false;

  try {
    if (!req.body) {
      throw res.status(400).send("Please Send with Correct Format");
    }

    const { error } = generatePaymentLinkValidation.validate(req.body);

    if (error) {
      throw res.status(400).send(error.details);
    }

    if (req.body.forceBypassRequestMandateAttempt === true) {
      forceBypassRequestMandateAttempt = true;
    }

    if (req.body.forceBypassSession === true) {
      forceBypassSession = true;
    }

    let attempt = 1;
    let page = "merchantPage";
    let requestMandateStatus = true;

    const getRequestMandate = await connection.getrow(
      `SELECT * FROM payment where type='requestMandatePayment' AND customer_id=${req.body.customerId} ORDER BY id DESC;`
    );

    if (getRequestMandate) {
      if (!forceBypassRequestMandateAttempt && getRequestMandate.attempt >= 2) {
        throw "Cannot proceed because try more than 2 times for E-Mandate.";
      }
      attempt = getRequestMandate.attempt + 1;
    }

    const today = new Date().toISOString();
    const data = await connection.getrow(
      `select c.*,o.* from \`order\` o  LEFT JOIN customer c  ON o.customer_id = c.id where o.customer_id = ${req.body.customerId}`
    );

    if (!data) {
      throw "Data not exist";
    }

    req.body.amount = parseFloat(req.body.amount).toFixed(2);

    const details = encodeURI(
      JSON.stringify([
        {
          detailsNumber: data.orderId,
          detailsDescription: `${data.first_name} ${data.last_name}`,
          detailsAmount: `${req.body.amount}`,
        },
      ])
    );

    const customerDetails = {
      nric: data.nric,
      tempId: data.temp_id,
    };

    const checkNric = await this.checkNric(customerDetails);

    if (!checkNric.flag) {
      throw checkNric.reason;
    }

    if (!forceBypassSession) {

      const checkSession = await this.checkSession(req.body.customerId);

      if (!checkSession) {
        throw "Session Expired. Please try again.";
      }
    }

    const bankList = await this.bankListing();

    if (!bankList) {
      throw `Problem when getting bank list.`;
    }

    const bankDetails = _.head(bankList);
    let bankDetail = {};

    for (var i = 0; i < bankDetails.length; i++) {
      if (req.body.bankId == _.head(bankDetails[i].id)) {
        bankDetail = bankDetails[i];
        break;
      }
    }

    if (JSON.stringify(bankDetail) == "{}") {
      throw `Bank ID Not Exist`;
    }

    const referenceNumber = await this.generateReferenceNumber();

    const name = data.name_as_per_nric
      .toString()
      .substring(0, 40)
      .replace(/'/g, '"')
      .trim();
    const email = data.email.toString().trim();
    const amount = parseFloat(req.body.amount).toFixed(2);

    const merchantUrl = `${`${process.env.domain}${mountAPI}/${page}`}`;
    const merchantCallbackUrl = `${`${process.env.domain}${mountAPI}/merchantCallBackUrl`}`;

    const checksumBody = this.createUrlParam({
      referenceNumber,
      effectiveDate: req.body.effectiveDate,
      amount,
      frequency: "MONTHLY",
      maximumFrequency: 99,
      purposeOfPayment: "Loans",
      businessModel: "B2C",
      name,
      emailAddress: email,
      idType: "NRIC",
      idValue: data.nric,
      bankId: req.body.bankId,
      linkId: "Notes",
      merchantId: process.env.merchant_id,
      employeeId: process.env.employee_id,
      method: "03",
      merchantUrl,
      merchantCallbackUrl,
    });

    const urlBody = "/new-mandate?" + checksumBody;

    /*
    const urlBody =
      `/new-mandate?referenceNumber=${referenceNumber}&effectiveDate=${req.body.effectiveDate}&expiryDate=&amount=${amount}&frequency=MONTHLY&maximumFrequency=99&purposeOfPayment=Loans&businessModel=B2C&name=${name}&emailAddress=${email}&phoneNumber=&idType=NRIC&idValue=${data.nric}&bankId=${req.body.bankId}&linkId=Notes&merchantId=${process.env.merchant_id}&employeeId=${process.env.employee_id}&method=03&details=&merchantUrl=${merchantUrl}&merchantCallbackUrl=${merchantCallBackUrl}`.trim();

      */

    const checksum = this.hashSHA256(
      `${process.env.curlec_checksum}|${urlBody}`
    );

    if (!checksum.status) {
      throw "Unable to Proceed to Next Payment.";
    }

    const checksumParam = configVariable.checksum
      ? `&checksum=${checksum.value}`
      : "";

    let requestMandate = encodeURI(
      `${process.env.curlec_url}${urlBody}${checksumParam}`
    ).trim();

    //requestMandate = requestMandate.replace(/'/g, '"');

    const newMandate = await connection.query(
      `INSERT into payment (referenceNumber,customer_id,instantPayAmount,type,attempt,requestTimeDateMandate,bankId, bankCode, bankName,created_at,requestMandate,status) VALUE ('${referenceNumber}',${
        req.body.customerId
      },${req.body.amount},'mandate',${attempt},'${today}',${_.head(
        bankDetail.id
      )},'${_.head(bankDetail.code)}','${_.head(
        bankDetail.name
      )}','${today}','${requestMandate}',1)`
    );

    if (!newMandate) {
      throw `Save request failed`;
    }

    if (requestMandateStatus) {
      const newRequestPayment = await connection.query(
        `INSERT into payment (referenceNumber,customer_id,instantPayAmount,type,attempt,requestTimeDateMandate,bankId, bankCode, bankName,created_at,requestMandate,status) VALUE ('${referenceNumber}',${
          req.body.customerId
        },${
          req.body.amount
        },'requestMandatePayment',${attempt},'${today}',${_.head(
          bankDetail.id
        )},'${_.head(bankDetail.code)}','${_.head(
          bankDetail.name
        )}','${today}','${JSON.stringify(req.body)}',1)`
      );

      if (!newRequestPayment) {
        throw `Save request Payment failed`;
      }
    }

    return res.status(200).json({
      url: requestMandate,
      message: `Customer exist. Proceed to Mandate Payment.`,
    });
  } catch (error) {
    console.log(error);
    if (error.message) return res.status(400).json({ message: error.message });

    return res.status(400).json({ message: error });
  }
};

exports.generateInstantPayLink = async (req, res, next) => {
  try {
    if (!req.body) {
      throw res.status(400).send("Please Send with Correct Format");
    }

    const { error } = generateInstantPaymentLinkValidation.validate(req.body);

    if (error) {
      throw res.status(400).send(error.details);
    }

    var today = moment().toISOString();

    const getMandate = await connection.getrow(
      `SELECT * FROM payment where type='mandate' AND customer_id=${req.body.customerId} AND status =1  AND requestTimeDateMandate IS NOT NULL ORDER BY id DESC LIMIT 1;`
    );

    if (!getMandate) {
      throw "Data not exist";
    }

    // const checkSession = await this.checkSession(req.body.customerId);

    // if (!checkSession) {
    //   throw "Session Expired. Please try again.";
    // }

    const dataQuery = await connection.getrow(
      `select p.*,c.*,o.* from payment p
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN  \`order\` o ON c.id = o.customer_id
      where p.referenceNumber='${getMandate.referenceNumber}'`
    );

    if (!dataQuery) {
      throw "Reference Number not exist.";
    }

    const amount = getMandate.instantPayAmount.toFixed(2);
    const email = dataQuery.email.toString().trim();

    const data = {};

    data.request = "requestInstantPay";
    data.requestDateTime = "requestDateTimeInstantPay";
    data.type = "requestInstantPay";
    data.status_respond = 1;

    const page = "merchantPage";

    const merchantUrl = `${process.env.domain}${mountAPI}/${page}`;

    const merchantCallbackUrl = `${process.env.domain}${mountAPI}/merchantCallBackUrl`;

    const checksumBody = this.createUrlParam({
      orderNo: getMandate.referenceNumber,
      //email,
      description,
      amount,
      bankCode: dataQuery.bankCode,
      merchantId: process.env.merchant_id,
      employeeId: process.env.employee_id,
      method: "03",
      merchantUrl,
      merchantCallbackUrl,
    });

    const urlBody = "/new-instant-pay?" + checksumBody;

    /*
    const urlBody = `/new-instant-pay?orderNo=${getMandate.referenceNumber}&email=${email}&description=${description}&amount=${amount}&bankCode=${dataQuery.bankCode}&merchantId=${process.env.merchant_id}&employeeId=${process.env.employee_id}&method=03&merchantUrl=${merchantUrl}&merchantCallbackUrl=${merchantCallBackUrl}`.trim();
    */
    const checksum = this.hashSHA256(
      `${process.env.curlec_checksum}|${urlBody}`
    );

    if (!checksum.status) {
      throw { message: "Unable to Proceed to Next Payment." };
    }

    const checksumParam = configVariable.checksum
      ? `&checksum=${checksum.value}`
      : "";

    data.url = encodeURI(`${process.env.curlec_url}${urlBody}${checksumParam}`);

    const newResponse = await connection.query(
      `INSERT into payment (referenceNumber,customer_id,instantPayAmount,type,attempt,${data.requestDateTime},bankId, bankCode, bankName,created_at,${data.request}, status) VALUE ('${getMandate.referenceNumber}',${dataQuery.customer_id},${amount},'${data.type}',1,'${today}',${dataQuery.bankId},'${dataQuery.bankCode}','${dataQuery.bankName}','${today}','${data.url}',${data.status_respond})`
    );

    if (!newResponse) {
      throw "Cannot create Instant Pay.";
    }

    return res.status(200).json({
      url: data.url,
      message: `Customer exist. Proceed to Program Fee Payment.`,
    });
  } catch (error) {
    console.log(error);
    if (error.message) return res.status(400).json({ message: error.message });

    return res.status(400).json({ message: error });
  }
};

exports.getMerchantPage = async (req, res, next) => {
  //Default data is on handling Mandate Payment( RM 1.00)
  let data = {
    title: "Renew Plus Mandate Status",
    status: "Authorization Failed!",
    msg: `Payment unsuccessful. Kindly ensure the bank details is correct and have sufficient balance in order to retry.`,
    url: `${process.env.renew_plus_url_v2}/customer/create/auth/`,
    //url: '#',
    //image: images.image.failedGif,
    //logo: images.image.logo,
    image: configVariable.failed,
    logo: configVariable.logo,
    footer: `For any enquiries, kindly contact the ReNew+ team at renew.plus@compasia.com`,
    order_status: 9,
    status_respond: 0,
    secondAttemptUrl: "",
    referenceNumber: "",
    button: "none",
    refreshMessage: false,
  };

  let status = false;
  let page = "merchantPage";

  try {
    let params = new URLSearchParams(req.query);

    const today = new Date().toISOString();

    const authCode = params.get("fpx_debitAuthCode").toString();

    const curlecMethod = params.get("curlec_method").toString();

    let dataQuery;

    dataQuery = await connection.getrow(
      `select p.*,c.*,o.* from payment p
      LEFT JOIN customer c ON p.customer_id = c.id
      LEFT JOIN  \`order\` o ON c.id = o.customer_id
      where p.referenceNumber='${params.get("fpx_sellerOrderNo")}'`
    );

    params.set("name", dataQuery.first_name);
    params.set("customer_id", dataQuery.customer_id);
    params.set("timestamp", Date.now());

    // const checkSession = await this.checkSession(dataQuery.customer_id);

    // if (!checkSession) {
    //   data.msg = "Session Expired. Please try again.";
    //   throw "Session Expired. Please try again.";
    // }

    logger.info(params);

    if (!dataQuery) {
      throw { message: "dataQuery" };
    }

    const orderDetails = await connection.getrow(
      `select * from \`order\` where orderId= '${dataQuery.orderId}'`
    );

    if (!orderDetails) {
      throw { message: "orderDetails" };
    }

    const tempInfo = await connection.getrow(
      `select * from temporary_info where id=${dataQuery.temp_id}`
    );

    if (!tempInfo) {
      throw { status: 400, message: "No Data For Temporary ID." };
    }

    if (dataQuery.attempt >= 2) {
      data.button = "none";
    }

    //Rewrite data variable if payment handling Instant-Pay
    if (curlecMethod == "01") {
      data = {
        title: "Renew Plus Instant Pay Status",
        status: "Payment Unsuccessful!",
        msg: `Thank you for your interest in applying to enrol for the Renew+ Subscription Program.
        We have reviewed your application and regret to inform you that your application is unsuccessful.
        The relevant charges that have been deducted from your account during the application process will be refunded to you within
        the next thirty (30) working days.`,
        url: `${process.env.renew_plus_url_v2}/customer/create/auth/`,
        //image: images.image.failedGif,
        //logo: images.image.logo,
        image: configVariable.failed,
        logo: configVariable.logo,
        footer: ` We apologize for any incovenience caused. For any enquiries, kindly reach out to us at renew.plus@compasia.com`,
        order_status: FAILED_PAYMENT,
        button: "none",
      };
    }

    const hash = crypto
      .createHash("md5")
      .update(`${process.env.secret_key}${orderDetails.id}`)
      .digest("hex");
    data.url = `${process.env.renew_plus_url_v2}/customer/create/auth/${orderDetails.id}/${hash}?status=${status}`;

    data.referenceNumber = params.get("fpx_sellerOrderNo");

    const respond = JSON.stringify(req.query).replace(/'/g, '"');

    const getStatus = this.defineResponsePayment(authCode);

    const amount = dataQuery.instantPayAmount.toFixed(2);

    let checkName = true;

    if (configVariable.compareName) {
      checkName = await this.compareName(
        `${dataQuery.name_as_per_nric}`,
        params.get("fpx_buyerName"),
        dataQuery.customer_id
      );
    }

    //Mandate
    if (curlecMethod == "00") {
      if (authCode == "00") {
        if (dataQuery.attempt >= 2) {
          data.button = "none";
          throw { message: "Exceed Mandate Count." };
        }

        data.refreshMessage = true;

        if (!checkName) {
          data.msg += " Please make sure that you use your bank account.";
          data.refreshMessage = true;
          throw { message: "Name not same." };
        }

        data.status = "Authorization Success!";
        data.msg =
          "Successful authorization. RM1.00 pre-authorization fee has been successfully deducted from your account. Please wait while we direct you to your online banking website to continue with the transaction. Please ensure the bank account you will be directed is the account you registered under the eMandate.";
        data.image = configVariable.sucess;

        //`${process.env.renew_plus_url}/customer/create/${tempInfo.id}/${tempInfo.hashvalue}`.trim();

        //`${process.env.renew_plus_url}/customer/bank/${tempInfo.id}/${tempInfo.hashvalue}`.trim();

        data.url =
          `${process.env.renew_plus_url_v2}/customer/mandate/auth/${orderDetails.id}/${tempInfo.hashvalue}`.trim();
      } else {
        data.url = `${process.env.renew_plus_url_v2}/customer/create/auth/${orderDetails.id}/${hash}?status=${status}`;

        if (dataQuery.attempt >= 2) {
          data.button = "none";
          data.refreshMessage = true;
          throw { message: "Exceed Mandate Count." };
        }

        data.button = "block";

        data.secondAttemptUrl = encodeURI(
          `${process.env.renew_plus_url_v2}/customer/bank/${tempInfo.id}/${tempInfo.hashvalue}`
        ).trim();

        data.url = `${process.env.renew_plus_url_v2}/customer/create/auth/${orderDetails.id}/${hash}?status=${status}`;
      }
    }

    //Instant Pay
    else if (curlecMethod == "01") {
      data.url = `${process.env.renew_plus_url_v2}/customer/create/auth/${orderDetails.id}/${hash}?status=${status}`;

      if (!checkName) {
        data.msg += " Please make sure that you use your bank account.";
        data.refreshMessage = true;
        throw { message: "Name not same." };
      }

      if (authCode == "00") {
        status = true;
        data.status = "Payment Successful!";
        data.msg =
          "Thank you for your order. Once your device is ready for collection, our crew will contact and assist you with the collection of the device at your preferred store.";
        data.url = encodeURI(
          `${process.env.renew_plus_url_v2}/customer/create/auth/${orderDetails.id}/${hash}?status=${status}`
        );
        //data.image = images.image.successGif;
        data.image = configVariable.sucess;
        data.footer = `Please wait while we are redirecting you to Renew+ within 60 seconds.`;
        data.order_status = 1;
      }
    }

    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );

    return res.render(page, data);
  } catch (error) {
    console.log(error);
    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );

    console.log(data);
    return res.render(page, data);
  }
};

exports.hashSHA256 = (value) => {
  try {
    const hashing = crypto.createHash("sha256").update(value).digest("hex");

    return {
      status: true,
      value: hashing,
    };
  } catch (error) {
    return {
      status: false,
      value: null,
    };
  }
};

exports.similarityTest = async (req, res, next) => {
  try {
    //Refer sample here => https://stackoverflow.com/questions/10473745/compare-strings-javascript-return-of-likely
    //It use Levenshtein Distance.

    const config = await connection.getrow(
      `select * from config
        where type= 'similarity'`
    );

    if (!config) {
      throw "Error Getting Percentage Similarity";
    }

    const percentage = parseFloat(config.value).toFixed(2);

    const page = "similarity";
    const data = { percentage };

    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    );

    return res.render(page, data);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      url: "",
      message: `Customer exist. Proceed to Program Fee Payment.`,
    });
  }
};
exports.similarity = (s1, s2) => {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (
    (longerLength - this.editDistance(longer, shorter)) /
    parseFloat(longerLength)
  );
};

exports.editDistance = (s1, s2) => {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

exports.createUrlParam = (data) => {
  const ret = [];
  for (let d in data) ret.push(d + "=" + data[d]);
  return ret.join("&");
};

exports.checkSession = async (customerId) => {
  try {
    const url = process.env.BACKEND_RENEWPLUS + "/api/session/" + customerId;
    const options = {
      url,
      method: "GET",
      timeout: 600000,
    };

    const session = await axios(options)
      .then((response) => {
        return { status: true, statusSession: response.data };
      })
      .catch((err) => {
        return {
          status: false,
          statusSession: "Session Expired. Please try again.",
        };
      });

    if (!session.status) {
      return false;
    }

    if (session.statusSession != 1) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

exports.checkNric = async (customerDetails) => {
  const checkStatus = {
    flag: false,
    status: "fail",
    reason: "Customer Blacklist",
  };
  try {
    const url =
      process.env.BACKEND_RENEWPLUS +
      "/api/customer/checknric/" +
      customerDetails.nric +
      "/" +
      customerDetails.tempId;

    const options = {
      url,
      method: "GET",
      timeout: 600000,
    };

    const nricStatus = await axios(options)
      .then((response) => {
        return { status: true, statusCheckNric: response.data };
      })
      .catch((err) => {
        return { status: false, statusCheckNric: "Checking Failed." };
      });

    if (!nricStatus.status) {
      throw "Failed";
    }

    if (nricStatus.statusCheckNric.status == "fail") {
      checkStatus.reason = nricStatus.statusCheckNric.reason;
      throw "Failed because status is Fail";
    }

    checkStatus.flag = true;
    checkStatus.status = nricStatus.statusCheckNric.status;
    checkStatus.reason = nricStatus.statusCheckNric.reason;

    return checkStatus;
  } catch (error) {
    return checkStatus;
  }
};
