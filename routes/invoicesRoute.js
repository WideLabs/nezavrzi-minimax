const express = require('express')
const router = express.Router()
const {
    issueInvoice
} = require('../controllers/invoicesController')
const {protect} = require('../middleware/authMiddleware')

router.route('/')
    .post(protect, issueInvoice)

module.exports = router