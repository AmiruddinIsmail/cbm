const jwt = require("jsonwebtoken");
const CONSTANTS = require("../utils/constants");
const Common = require("../utils/common");

const verifyToken = (req, res, next) => {
  let token = req.headers["authorization"];
  token = token?.replace(/^Bearer\s+/, "");

  if (!token) {
    return res
      .status(400)
      .send(
        Common.generateApiFailureResult(
          400,
          CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.COMMON_ERROR_MESSAGE,
          [CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.ERRORS_ACCESS_DENIED]
        )
      );
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    console.log(err);

    if (err) {
      return res
        .status(401)
        .send(
          Common.generateApiFailureResult(
            401,
            CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.COMMON_ERROR_MESSAGE,
            [CONSTANTS?.EKYC_APP_API?.ERROR_MESSAGE?.TOKEN_EXPIRED]
          )
        );
    }

    req.user = user;

    return next();
  });
};

module.exports = verifyToken;
