const Joi = require("joi");

module.exports = generateInstantPaymentLinkValidation = Joi.object({
  customerId: Joi.number().integer().required(),
 
});
