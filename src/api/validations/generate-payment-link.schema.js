const Joi = require("joi");

module.exports = generatePaymentLinkValidation = Joi.object({
  customerId: Joi.number().integer().required(),
  typeofIdentity: Joi.string()
    .required()
    .valid("PASSPORT_NUMBER", "NRIC", "OLD_IC", "BUSINESS_REGISTRATION_NUMBER"),
  amount: Joi.number().required(),
  effectiveDate: Joi.date().required(),
  forceBypassRequestMandateAttempt: Joi.boolean(),
  forceBypassSession: Joi.boolean(),
  bankId: Joi.number().required().required(),
});