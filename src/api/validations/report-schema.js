const Joi = require('joi').extend(require('@joi/date'))


module.exports = reportValidation = Joi.object({
   name: Joi.string().required(),
   dob: Joi.date().format('DD/MM/YYYY').required(),
   nric: Joi.string().max(12).min(12).required(),
   retry: Joi.number(),
   orderID: Joi.string(),
   gendercodename: Joi.number(),
   age: Joi.number(),
   monthly_income: Joi.number(),
})