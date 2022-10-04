const express = require('express')
const router = express.Router()
const {getUserOrganizations, getPaymentMethods} = require('../controllers/organizationsController')
const {protect} = require('../middleware/authMiddleware')

router.route('/')
    .get(protect, getUserOrganizations)

router.route('/paymentMethods')
    .get(protect, getPaymentMethods)

module.exports = router