const { apiGet, apiPost, apiPut } = require('../api/callsApi')
const { getFormatedDate } = require('../utils/dateUtils')
const { apiBaseUrl } = require('../config')
const httpStatusCodes = require('../utils/httpStatusCodes')
const { itemMandatoryFieldsCheck } = require('../utils/mandatoryFieldsCheck')
const orgId = process.env.organization_id.toString();

// @desc Get articles/items for given organization id
// @route GET /items
const getItems = async (req, res) => {
    const {authToken} = req
    const response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/items`, authToken)
    return res.status(response.statusCode).json(response)
}

// @desc Get specific article/item by Id
// @route GET /items/:id
const getItemById = async (req, res) => {
    const {authToken} = req
    const {id} = req.params
    const response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/items/${id}`, authToken)
    return res.status(response.statusCode).json(response)
}

// @desc Get specific article/item by unique code
// @route GET /items/code/:code
const getItemByCode = async (req, res) => {
    const {authToken} = req
    const {code} = req.params
    const response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/items/code(${code})`, authToken)
    return res.status(response.statusCode).json(response)
}

// @desc Add new article/item
// @route POST /items
const addItem = async (req, res) => {
    const {authToken} = req
    const {item} = req.body
    if (!item) {
        return res.status(httpStatusCodes.BAD_REQUEST).json({
            statusCode: httpStatusCodes.BAD_REQUEST,          
            error: "Missing item in request body."
        })   
    }
    const missingMandatoryFields = itemMandatoryFieldsCheck(item)
    if(missingMandatoryFields.length > 1) {
        return res.status(httpStatusCodes.BAD_REQUEST).json({
            statusCode: httpStatusCodes.BAD_REQUEST,          
            error: `Missing mandatory item fields {${missingMandatoryFields.toString()}}`
        })
    }

    const date = getFormatedDate()

    // Connected ID's
    let {countryCode, currencyCode} = req.body
    let response = undefined
    countryCode = countryCode ? countryCode : "SI"
    currencyCode = currencyCode ? currencyCode : "EUR"
    vatRateCode = item.VatRateCode ? VatRateCode : "S"
    // Country data
    response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/countries/code(${countryCode})`, authToken)
    if(response.statusCode !== httpStatusCodes.OK) return res.status(response.statusCode).json(response)
    const country = response.data
    // VatRate data
    response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/vatrates/code(${vatRateCode})?date=${date}&countryID=${country.CountryId}`, authToken)
    if(response.statusCode !== httpStatusCodes.OK) return res.status(response.statusCode).json(response)
    const vatRate = response.data
    // Currency data
    response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/currencies/code(${currencyCode})`, authToken)
    if(response.statusCode !== httpStatusCodes.OK) return res.status(response.statusCode).json(response)
    const currency = response.data

    const newItem = {
        Code: item.Code,
        Name: item.Name,
        ItemType: item.ItemType ? item.ItemType : "B",
        StocksManagedOnlyByQuantity: item.StocksManagedOnlyByQuantity ? item.StocksManagedOnlyByQuantity : "N",
        UnitOfMeasurement: item.UnitOfMeasurement ? item.UnitOfMeasurement : "KOM",
        VatRate: {
            ID: vatRate.VatRateId
        },
        Price: item.Price,
        Currency: {
            ID: currency.CurrencyId
        }
    }

    response = await apiPost(`${apiBaseUrl}/api/orgs/${orgId}/items`, authToken, newItem)
    return res.status(response.statusCode).json(response)
}

// @desc Update item on minimax
// @route PUT /items/code/:code
const updateItem = async (req, res) => {
    const {authToken} = req
    const {code} = req.params
    const item = req.body
    if (!item) {
        return res.status(httpStatusCodes.BAD_REQUEST).json({
            statusCode: httpStatusCodes.BAD_REQUEST,          
            error: "Missing item in request body."
        }) 
    }
    let response = undefined
    response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/items/code(${code})`, authToken)
    if(response.statusCode !== httpStatusCodes.OK) return res.status(response.statusCode).json(response)
    let mmItem = response.data
    // Override minimax items properties with values from request body
    for (let [key, value] of Object.entries(item)) {
        mmItem[key] = value
    }
    response = await apiPut(`${apiBaseUrl}/api/orgs/${orgId}/items/${mmItem.ItemId}`, authToken, mmItem)
    return res.status(response.statusCode).json(response)
}

module.exports = {
    getItems,
    getItemById,
    getItemByCode,
    addItem,
    updateItem
}