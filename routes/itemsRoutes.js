const express = require('express')
const router = express.Router()
const {
    getItems,
    getItemByCode,
    addItem,
    updateItem
} = require('../controllers/itemsController')
const {protect} = require('../middleware/authMiddleware')

router.route('/')
    .get(protect, getItems)
    .post(protect, addItem)

router.route('/code/:code')
    .get(protect, getItemByCode)
    .put(protect, updateItem)

module.exports = router