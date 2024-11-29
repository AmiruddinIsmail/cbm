const Joi = require('joi')
const { recurringPayment } = require('../controllers/ekyc-app.controller')


module.exports = recurringPaymentValidation = Joi.object({
    contractNumber: Joi.string().required()
})