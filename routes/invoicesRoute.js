const express = require('express')
const router = express.Router()
const {
    issueInvoice
} = require('../controllers/invoicesController')

router.route('/')
    .post(issueInvoice)

module.exports = router