const xml2 = require("xml2js");

module.exports = async function errorCbm(file, numberOfRequest) {
  var parser = new xml2.Parser();
  let res = await parser.parseStringPromise(file).then(function (result) {
    let item;
    if (
      result.Response.Errors[0].length === 0 ||
      result.Response.Errors[0].Error[0] === ""
    ) {
      item = result.Response.ReqNo[0];
      return item;
    } else {
      const errorCode = result.Response.Errors[0].ErrorStdCode[0];
      return {
        status: "pending",
        message: `CCRIS service not available on ${numberOfRequest}`,
        code: 500,
        errorCode,
      };
    }
  });
  return res;
};
