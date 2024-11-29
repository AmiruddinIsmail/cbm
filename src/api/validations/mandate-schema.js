const Joi = require('joi')


module.exports = mandateValidation = Joi.object({
    amount: Joi.number().required(),
    frequency: Joi.string().required(),
    maximumFrequency: Joi.number().required(),
    purposePayment: Joi.number().required(),
    // businessModel: Joi.number().required(),
    name: Joi.string().required(),
    emailAddress: Joi.string().required(),
    idType: Joi.string().required(),
    idValue: Joi.number().required(),
    bankId: Joi.number().required(),
    // merchantId: Joi.string().required(),
    // employeeId: Joi.string().required(),
    // method: Joi.number().required(),
})