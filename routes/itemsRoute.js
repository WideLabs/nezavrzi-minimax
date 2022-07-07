const express = require('express')
const router = express.Router()
const {
    getItems,
    getItemByCode,
    addItem,
    updateItem
} = require('../controllers/itemsController')

router.route('/')
    .get(getItems)
    .post(addItem)

router.route('/code/:code')
    .get(getItemByCode)
    .put(updateItem)

module.exports = router