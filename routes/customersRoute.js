const express = require('express')
const router = express.Router()
const {
    getCustomers,
    getCustomerByCode,
    addCustomer,
    updateCustomer
} = require('../controllers/customersController')

router.route('/')
    .get(getCustomers)
    .post(addCustomer)

router.route('/code/:code')
    .get(getCustomerByCode)
    .put(updateCustomer)

module.exports = router