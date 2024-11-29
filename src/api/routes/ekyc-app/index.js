const express = require("express");
const app = express();
const helmet = require("helmet");

const router = express.Router();
const auth = require("../../middlewares/auth");
const {
  bankList,
  getMandate,
  getInstantPay,
  generatePaymentLink,
  testReport,
  testXML,
  merchantCallBackURL,
  secondAttempt,
  secondAttemptView,
  loopExcel,
  testSP,
  recurringPayment,
  templateXML,
  generateMandateLink,
  generateInstantPayLink,
  similarityTest,
  getMerchantPage,
} = require("../../controllers/ekyc-app.controller");
var bodyParser = require("body-parser");

const cors = require("cors");

router.get("/status", (req, res) => res.send("OK"));

router.get("", (req, res) => res.send("OK"));

router.post("/testSP", testSP);

router.get("/bankList", bankList);

router.get("/templateXML", templateXML);

router.post("/testReport", testReport);

router.get("/mandate", getMandate);

router.get("/mandate", getMandate);
router.get("/secondAttempt", secondAttemptView);
router.get("/instantPay", getInstantPay);

router.post("/merchantCallBackUrl", merchantCallBackURL);

router.post("/generatePaymentLink", generatePaymentLink);

router.post("/secondAttempt", secondAttempt);

router.post("/testXML", testXML);

router.post("/loopExcel", loopExcel);
router.post("/recurringPayment", recurringPayment);
router.get("/similarityTest", similarityTest);

/**
 *
 * V2
 */
router.post("/v2/generateMandateLink", generateMandateLink);
router.post("/v2/generateInstantPayLink", generateInstantPayLink);
router.get("/merchantPage", getMerchantPage);

module.exports = router;
