const jwt = require('jsonwebtoken');
const fs = require('fs')
const jsonToXml = require('../utils/convert');
const objToArray = require('../utils/convert')
const reportValidation = require('../validations/report-schema')
const mandateValidation = require('../validations/mandate-schema')
const connection = require('../middlewares/db.js')
const INSERTREPORT = require('../utils/sql')
const logger = require('../../config/logger')
const open = require('open')
const axios = require('axios')
const path = require('path')
const https = require('https')

exports.getToken = async (req, res, next) => {
  if (!req.body.client_id || !req.body.client_secret) {
    return res.status(400).json({
      error: CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.INVALID_CLIENT,
    });
  }

  const client = CONSTANTS.PROGRAM[process.env.NODE_ENV].find(
    (x) =>
      x.CLIENT_ID === req.body.client_id &&
      x.CLIENT_SECRET === req.body.client_secret
  );
  if (!client) {
    return res.status(400).json({
      error: CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.INVALID_CLIENT,
    });
  }

  if (!req.body.grant_type || req.body.grant_type !== "client_credentials") {
    return res.status(400).json({
      error: CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.UNSUPPORTED_GRANT_TYPE,
    });
  }

  if (!req.body.scope || req.body.scope !== "publicscope") {
    return res.status(400).json({
      error: CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.INVALID_SCOPE,
    });
  }

  try {
    let token = jwt.sign(
      {
        client_id: client?.CLIENT_ID,
        scope: ["publicscope"],
      },
      process.env.JWT_SECRET,
      { expiresIn: parseInt(process.env.JWT_EXPIRATION_SECONDS) }
    );

    return res.status(200).json({
      access_token: token,
      expires_in: parseInt(process.env.JWT_EXPIRATION_SECONDS),
      token_type: "Bearer",
    });
  } catch (error) {
    return res.status(500).json({
      error: CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.COMMON_ERROR_MESSAGE,
    });
  }
};

exports.bankList = async(req,res,next) => {
 const response = await axios.post('https://demo.curlec.com/curlec-services/banks?method=00&msgToken=01')

  res.json(response.data.Response)
}

exports.getMandate = async(req,res, next) => {
  let params = new URLSearchParams(req.query)
  let authCode = params.get('fpx_debitAuthCode')
  if(authCode == 0){
    return true
  }
  res.send('Hello')
}

exports.mandate = async(req, res, next) => {
    const {price, bank} = req.body;


    // const {error} = mandateValidation.validate(data)

    // if(error){
    //   res.send(error.details)
    // }

    // open('http://localhost:3000/ekyc-app/status', {app:{name: 'google chrome'}})

    // open(`https://demo.curlec.com/new-mandate?referenceNumber=M006&effectiveDate=2020-11-11&expiryDate=&amount=1000.00&frequency=MONTHLY&maximumFrequency=99&purposeOfPayment=Loans&businessModel=B2C&name=Joe&emailAddress=test@test.com&phoneNumber=&idType=BUSINESS_REGISTRATION_NUMBER&idValue=88585858599&bankId=19&linkId=Notes&merchantId=7218372&employeeId=722028&method=03&details=%5B%7B%22detailsNumber%22%3A%22DT0001%22%2C%22detailsDescription%22%3A%22DetailsOne%22%2C%22detailsAmount%22%3A%2210.00%22%7D%2C%7B%22detailsNumber%22%3A%22DT0002%22%2C%22detailsDescription%22%3A%22DetailsTwo%22%2C%22detailsAmount%22%3A%2220.00%22%7D%5D`)


    //api request to curlec 

    //get response and send to frontend
}

exports.getReport = async (req, res, next) => {
   const data = req.body;

  //  const {error} = reportValidation.validate(data)


  // if(error){    
  //   return res.status(400).json({
  //     error: error.details
  //   })
  // }
  let url = 'https://uat.creditbureau.com.my/scbs/B2BServiceAction'

  let file = path.resolve('./newFiles.xml')
  let ca_file = path.resolve('./DigiCertCA.pem')
  let cert_file = path.resolve('./TrustedRoot.crt')

  const agent = new https.Agent({
    requestCert: true,
    rejectUnauthorized: false,
    cert: cert_file,
    ca: ca_file,
  })

  const options = {
    url,
    method: "POST",
    httpsAgent: agent,
    headers: {
      'Content-Type' : 'text_xml'
    },
    data: file
  }

  axios(options).then(response => {
    console.log(response)
  }).catch(err => {
    console.log(err)
  })


  
  // let {SystemID, Service, ReportType, MemberID, UserID, ReqNo, SequenceNo, ReqDate, PurposeStdCode, IdNo1, Name, Dob, ConstitutionTypeStdCode, } = req.body
  // let jsonObj = {
  //   Request:[{
  //     SystemID,
  //     Service,
  //     ReportType,
  //     MemberID,
  //     UserID,
  //     ReqNo,
  //     SequenceNo,
  //     ReqDate,
  //     PurposeStdCode,
  //     Subject:[
  //       {
  //         IdNo1,
  //         Name,
  //         Dob,
  //         ConstitutionTypeStdCode,

  //       }
  //     ]
  //   }]
  // }

  // let json = objToArray(data)
  // //logger to insert inside database
  //  connection.query(INSERTREPORT, json, function(err, results, fields){
  //   if(err) logger.error(err.message)
  //   logger.info(results)
  // })

 
  // let xml = jsonToXml(jsonObj)

  // let file = fs.writeFileSync("./newFiles.xml",xml, function(err){
  //   if(err) throw err
  // })


  
  //do api request

  //get the response
  //the xml file, push to s3

}

exports.retrieveOrder = async (req, res, next) => {
  let errors = [];

  if (!req.body.governmentId) {
    errors.push(
      CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
        ?.RETRIEVE_ORDER_ERRORS_GOVERNMENT_ID_REQUIRED
    );
  }

  if (errors.length) {
    return res
      .status(400)
      .json(
        Common.generateApiFailureResult(
          400,
          CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
            ?.RETRIEVE_CUSTOMER_ERROR_MESSAGE,
          errors
        )
      );
  }

  let returnValue2 = {
    id: "string",
    orderNumber: "string",
    orderDate: "string",
    customerId: "string",
    programId: "string",
    campaignId: "string",
    orderId: "string",
    status: "number",
    tenure: "number",
    deposit: "number",
    insured: "boolean",
    sku: "string",
    skuId: "string",
    deviceColor: "string",
    deviceColorHex: "string",
    deviceCapacity: "string",
    price: "number",
    branchId: "string",
  };

  let returnValue = {
    id: "b9fd7c1e-ba3c-ed11-bba3-0022485957f9",
    orderNumber: null,
    origin: null,
    orderDate: "2022-09-25T00:00:00Z",
    customerId: "e6e52512-ba3c-ed11-bba3-0022485957f9",
    programId: "d7537c46-3dc4-ec11-a7b5-0022485980f5",
    campaignId: "9373d4be-40c4-ec11-a7b5-0022485980f5",
    status: 1,
    tenure: 24,
    deposit: 88.0,
    insured: false,
    skuId: "ea99a372-8f09-ed11-82e5-0022485957f9",
    sku: "YES-OP-A77-128-BK-24",
    deviceColor: "Black",
    deviceColorHex: "#282e32",
    deviceCapacity: "128",
    price: 88.0,
    branchId: "0f41eb88-a5c4-ec11-a7b5-0022485a556e",
    contractSignedDate: null,
    deviceId: "00000000-0000-0000-0000-000000000000",
    drvFee: 0.0,
    orixDeviceCost: 0.0,
    orderTac: null,
    orderTacSubmitDateTime: null,
    orderTacEntryLog: null,
  };

  try {
    return res
      .status(200)
      .json(
        Common.generateApiSuccessResult(
          returnValue,
          CONSTANTS?.EKYC_APP_API?.SUCCESS_MESSAGE?.RETRIEVE_ORDER
        )
      );
  } catch (err) {
    return res.status(500).json(Common.generateApiGenericFailureResult(err));
  }
};

exports.retrieveCustomer = async (req, res, next) => {
  let errors = [];

  if (!req.body.governmentId) {
    errors.push(
      CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
        ?.RETRIEVE_CUSTOMER_ERRORS_GOVERNMENT_ID_REQUIRED
    );
  }

  if (errors.length) {
    return res
      .status(400)
      .json(
        Common.generateApiFailureResult(
          400,
          CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
            ?.RETRIEVE_CUSTOMER_ERROR_MESSAGE,
          errors
        )
      );
  }

  let returnValue2 = {
    fullName: "string",
    emailAddress: "string",
    mobilePhone: "string",
    governmentId: "string",
    governmentIdExpiry: "Date",
    companyName: "string",
    gender: "number",
    dob: "Date",
    altContactName: "string",
    altContactMobilePhone: "string",
    billingAddress: {
      street: "string",
      city: "string",
      state: "string",
      country: "string",
      postalCode: "string",
    },
    deliveryAddress: {
      street: "string",
      city: "string",
      state: "string",
      country: "string",
      postalCode: "string",
    },
  };

  let returnValue = {
    id: "e6e52512-ba3c-ed11-bba3-0022485957f9",
    fullName: "AIMAN FIRDAUS BIN SHAMSURI",
    emailAddress: "LINDA.MUTAL@GMAIL.COM",
    mobilePhone: "0142230736",
    governmentId: "850323146488",
    governmentIdExpiry: null,
    idFrontMedia: null,
    idBackMedia: null,
    kycMedia1: null,
    kycMedia2: null,
    companyName: null,
    gender: 1,
    dob: "1985-03-23T00:00:00",
    altContactName: "AIMAN FIRDAUS BIN SHAMSURI",
    altContactMobilePhone: "600142230736",
    billingAddress: {
      street:
        "504 B3 SEKSYEN 1 WANGSA MAJU SETAPAK KUALA LUMPUR W. PERSEKUTUAN(KL) ",
      city: "KUALA LUMPUR",
      state: null,
      country: "Malaysia",
      postalCode: "53300",
    },
    deliveryAddress: {
      street:
        "504 B3 SEKSYEN 1 WANGSA MAJU SETAPAK KUALA LUMPUR W. PERSEKUTUAN(KL) ",
      city: "KUALA LUMPUR",
      state: null,
      country: "Malaysia",
      postalCode: "53300",
    },
    programId: null,
    salaryIncome: null,
    salaryIncomeSlipMedia: null,
    governmentIdVerifier: null,
    emailAddressVerifier: null,
    partnerReferenceID: null,
    governmentIdType: null,
    branchState: null,
  };

  try {
    return res
      .status(200)
      .json(
        Common.generateApiSuccessResult(
          returnValue,
          CONSTANTS?.EKYC_APP_API?.SUCCESS_MESSAGE?.RETRIEVE_CUSTOMER
        )
      );
  } catch (err) {
    return res.status(500).json(Common.generateApiGenericFailureResult(err));
  }
};

exports.retrieveDevice = async (req, res, next) => {
  let errors = [];

  if (!req.params.skuId) {
    errors.push(
      CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
        ?.RETRIEVE_DEVICE_ERRORS_DEVICE_ID_REQUIRED
    );
  }

  if (errors.length) {
    return res
      .status(400)
      .json(
        Common.generateApiFailureResult(
          400,
          CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.RETRIEVE_DEVICE_ERROR_MESSAGE,
          errors
        )
      );
  }

  let returnValue2 = {
    id: "string",
    sku: "string",
    brand: "string",
    make: "string",
    model: "string",
    colorName: "string",
    colorHexCode: "string",
    capacity: "string",
    specifications: "any",
    price: "number",
    deposit: "number",
    tenure: "number",
    preOwned: "boolean",
    insurance: "boolean",
    images: "any",
  };

  let returnValue = {
    id: "ea99a372-8f09-ed11-82e5-0022485957f9",
    sku: "YES-OP-A77-128-BK-24",
    brand: "Oppo",
    make: "6GB(5GB)+128GB",
    model: "A77",
    colorName: "Black",
    colorHexCode: "#282e32",
    capacity: "128",
    specifications: "Plan: 24 Months",
    price: 63.0,
    deposit: 63.0,
    tenure: 5,
    preOwned: false,
    insurance: false,
    images: null,
    category: null,
    categoryOrdering: 0,
    deviceOrdering: 0,
    deviceId: "00000000-0000-0000-0000-000000000000",
    drvFee: 0.0,
    deviceCost: 0.0,
  };

  try {
    return res
      .status(200)
      .json(
        Common.generateApiSuccessResult(
          returnValue,
          CONSTANTS?.EKYC_APP_API?.SUCCESS_MESSAGE?.RETRIEVE_DEVICE
        )
      );
  } catch (err) {
    return res.status(500).json(Common.generateApiGenericFailureResult(err));
  }
};

exports.retrieveContract = async (req, res, next) => {
  let returnValue = CONSTANTS?.CONTRACT_BASE64;

  try {
    return res
      .status(200)
      .json(
        Common.generateApiSuccessResult(
          returnValue,
          CONSTANTS?.EKYC_APP_API?.SUCCESS_MESSAGE?.RETRIEVE_CONTRACT
        )
      );
  } catch (err) {
    return res.status(500).json(Common.generateApiGenericFailureResult(err));
  }
};

exports.createContract = async (req, res, next) => {
  let errors = [];

  if (!req.body.orderId) {
    errors.push(
      CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
        ?.CREATE_CONTRACT_ERRORS_ORDER_ID_REQUIRED
    );
  }

  if (!req.body.imei1) {
    errors.push(
      CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
        ?.CREATE_CONTRACT_ERRORS_IMEI_REQUIRED
    );
  }

  if (!req.body.signature) {
    errors.push(
      CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
        ?.CREATE_CONTRACT_ERRORS_SIGNATURE_REQUIRED
    );
  }

  if (errors.length) {
    return res
      .status(400)
      .json(
        Common.generateApiFailureResult(
          400,
          CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.CREATE_CONTRACT_ERROR_MESSAGE,
          errors
        )
      );
  }

  let returnValue = "bb0c7d24-39a7-eb11-9442-000d3ac91b5b";

  try {
    return res
      .status(200)
      .json(
        Common.generateApiSuccessResult(
          returnValue,
          CONSTANTS?.EKYC_APP_API?.SUCCESS_MESSAGE?.CREATE_CONTRACT
        )
      );
  } catch (err) {
    return res.status(500).json(Common.generateApiGenericFailureResult(err));
  }
};

exports.updateStatus = async (req, res, next) => {
  let errors = [];

  if (!req.body.statusType) {
    errors.push(
      CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
        ?.CREATE_CONTRACT_ERRORS_ORDER_ID_REQUIRED
    );
  }

  if (req.body.statusType === CONSTANTS?.ORDER_STATUS?.CANCELLED) {
    errors.push(
      CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
        ?.UPDATE_STATUS_ERRORS_ORDER_ID_REQUIRED
    );
  }

  if (req.body.statusType !== CONSTANTS?.ORDER_STATUS?.CANCELLED) {
    errors.push(
      CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
        ?.UPDATE_STATUS_ERRORS_CUSTOMER_ID_REQUIRED
    );
  }

  // if (
  //   req.body.statusType === CONSTANTS?.ORDER_STATUS?.SUSPENDED ||
  //   req.body.statusType === CONSTANTS?.ORDER_STATUS.CHECKING
  // ) {
  //   errors.push(
  //     CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
  //       ?.UPDATE_STATUS_ERRORS_CUSTOMER_ID_REQUIRED
  //   );
  // }

  let returnValue = true;

  try {
    return res
      .status(200)
      .json(
        Common.generateApiSuccessResult(
          returnValue,
          CONSTANTS?.EKYC_APP_API?.SUCCESS_MESSAGE?.UPDATE_STATUS
        )
      );
  } catch (err) {
    return res.status(500).json(Common.generateApiGenericFailureResult(err));
  }
};

exports.updateCustomer = async (req, res, next) => {
  let returnValue = "e6e52512-ba3c-ed11-bba3-0022485957f9";

  try {
    return res
      .status(200)
      .json(
        Common.generateApiSuccessResult(
          returnValue,
          CONSTANTS?.EKYC_APP_API?.SUCCESS_MESSAGE?.UPDATE_CUSTOMER
        )
      );
  } catch (err) {
    return res.status(500).json(Common.generateApiGenericFailureResult(err));
  }
};

exports.getContract = async (req, res, next) => {
  if (!req.body.orderId) {
    return res
      .status(400)
      .json(
        Common.generateApiFailureResult(
          400,
          CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.GET_CONTRACT_ERROR_MESSAGE,
          [
            CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE
              ?.GET_CONTRACT_ERRORS_ORDER_ID_REQUIRED,
          ]
        )
      );
  }

  let returnValue = {
    imei: "355885144150070",
  };

  try {
    return res
      .status(200)
      .json(
        Common.generateApiSuccessResult(
          returnValue,
          CONSTANTS?.EKYC_APP_API?.SUCCESS_MESSAGE?.GET_CONTRACT
        )
      );
  } catch (err) {
    return res.status(500).json(Common.generateApiGenericFailureResult(err));
  }
};

exports.getBranches = async (req, res, next) => {
  let returnValue = [];

  returnValue.push({
    id: "e86fa2e0-94a0-ea11-a812-000d3a07b28a",
    name: "The Gardens Mid Valley",
    code: "3044514",
    email: "patrick.applicate@gmail.com",
    alternativeEmail: null,
    phoneNumber: null,
    operatingHours: null,
    address:
      "Lot T241, 3rd Floor,\nGardens Mall, Mid Valley City\nMedan Syed Putra Utara,\n59200 Kuala Lumpur",
    branchState: 921250012,
    branchStateName: null,
  });

  try {
    return res
      .status(200)
      .json(
        Common.generateApiSuccessResult(
          returnValue,
          CONSTANTS?.EKYC_APP_API?.SUCCESS_MESSAGE?.GET_BRANCHES
        )
      );
  } catch (err) {
    return res.status(500).json(Common.generateApiGenericFailureResult(err));
  }
};
