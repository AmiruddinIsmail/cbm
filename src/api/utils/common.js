const CONSTANTS = require("./constants");

const generateApiSuccessResult = (data, message) => {
  return {
    status: CONSTANTS?.EKYC_APP_API?.STATUS?.SUCCESS,
    httpStatus: 200,
    statusCode: 200,
    errorMessage: null,
    errors: [],
    message: message,
    data: data,
  };
};

const generateApiFailureResult = (httpStatus, errorMessage, errors) => {
  return {
    status: CONSTANTS?.EKYC_APP_API?.STATUS?.FAIL,
    httpStatus: httpStatus,
    statusCode: httpStatus,
    errorMessage: errorMessage,
    errors: errors,
    message: '',
    data: null,
  };
};

const generateApiGenericFailureResult = (err) => {
  return {
    status: CONSTANTS?.EKYC_APP_API?.STATUS?.FAIL,
    httpStatus: 500,
    statusCode: 500,
    errorMessage: CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.COMMON_ERROR_MESSAGE,
    errors: [CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.COMMON_ERROR_MESSAGE],
    message: '',
    data: null,
  };
};

module.exports = {
  generateApiSuccessResult,
  generateApiFailureResult,
  generateApiGenericFailureResult,
};
