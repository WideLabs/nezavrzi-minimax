const express = require('express')
const router = express.Router()
const {
    getCustomers,
    getCustomerByCode,
    addCustomer,
    updateCustomer
} = require('../controllers/customersController')
const {protect} = require('../middleware/authMiddleware')

router.route('/')
    .get(protect, getCustomers)
    .post(protect, addCustomer)

router.route('/code/:code')
    .get(protect, getCustomerByCode)
    .put(protect, updateCustomer)

module.exports = router