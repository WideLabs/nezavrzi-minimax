const { apiGet, apiPost, apiPut } = require('../api/callsApi')
const { apiBaseUrl } = require('../config')
const httpStatusCodes = require('../utils/httpStatusCodes')
const { customerMandatoryFieldsCheck } = require('../utils/mandatoryFieldsCheck')
const orgId = process.env.organization_id.toString()

// @desc Get all customers for given organization id
// @route GET /customers
const getCustomers = async (req, res) => {
    const {authToken} = req
    const response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/customers`, authToken)
    return res.status(response.statusCode).json(response)
}

// @desc Get specific customer by customer id
// @route GET /customers/:id
const getCustomerById = async (req, res) => {
    const {authToken} = req
    const {id} = req.params
    const response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/customers/${id}`, authToken)
    return res.status(response.statusCode).json(response)
}

// @desc Get specific customer by unique code
// @route GET /customers/code/:code
const getCustomerByCode = async (req, res) => {
    const {authToken} = req
    const {code} = req.params;
    const response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/customers/code(${code})`, authToken)
    return res.status(response.statusCode).json(response)
}

// @desc Add new customer
// @route POST /customers
const addCustomer = async (req, res) => {
    const {authToken} = req
    const {customer} = req.body;
    if(!customer) {
        return res.status(httpStatusCodes.BAD_REQUEST).json({
            statusCode: httpStatusCodes.BAD_REQUEST,          
            error: "Missing customer in request body."
        })      
    }
    const missingMandatoryFields = customerMandatoryFieldsCheck(customer)
    if(missingMandatoryFields.length > 1) {
        return res.status(httpStatusCodes.BAD_REQUEST).json({
            statusCode: httpStatusCodes.BAD_REQUEST,          
            error: `Missing mandatory customer fields {${missingMandatoryFields.toString()}}`
        })
    }

    // Connected ID's
    let response = undefined
    const countryCode = customer.CountryCode ? customer.CountryCode : "SI"
    const currencyCode = "EUR"
    // Country data
    response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/countries/code(${countryCode})`, authToken)
    if(response.statusCode !== httpStatusCodes.OK) return res.status(response.statusCode).json(response)
    const country = response.data
    // Currency data
    response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/currencies/code(${currencyCode})`, authToken)
    if(response.statusCode !== httpStatusCodes.OK) return res.status(response.statusCode).json(response)
    const currency = response.data

    const newCustomer = {
        Code: customer.Code,
        Name: customer.Name,
        Address: customer.Address,
        PostalCode: customer.PostalCode,
        City: customer.City,
        Country: {
            ID: country.CountryId
        },
        SubjectToVAT: customer.SubjectToVAT ? customer.SubjectToVAT : "N",
        VATIdentificationNumber: customer.VATIdentificationNumber ? customer.VATIdentificationNumber : null,
        Currency: {
            ID: currency.CurrencyId
        },
        EInvoiceIssuing: "SeNePripravlja"
    }
    response = await apiPost(`${apiBaseUrl}/api/orgs/${orgId}/customers`, authToken, newCustomer)
    return res.status(response.statusCode).json(response)
}

// @desc Update customer on minimax based on Code
// @route PUT /customers/code/:code
const updateCustomerByCode = async (req, res) => {
    const {authToken} = req
    const {code} = req.params
    const customer = req.body
    if (!customer) {
        return res.status(httpStatusCodes.BAD_REQUEST).json({
            statusCode: httpStatusCodes.BAD_REQUEST,          
            error: "Missing customer in request body."
        })  
    }
    let response = undefined
    response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/customers/code(${code})`, authToken)
    if(response.statusCode !== httpStatusCodes.OK) return res.status(response.statusCode).json(response)
    let mmCustomer = response.data
    // Override minimax items properties with values from request body
    for (let [key, value] of Object.entries(customer)) {
        mmCustomer[key] = value
    }
    response = await apiPut(`${apiBaseUrl}/api/orgs/${orgId}/customers/${mmCustomer.CustomerId}`, authToken, mmCustomer)
    return res.status(response.statusCode).json(response)
}

module.exports = {
    getCustomers,
    getCustomerById,
    getCustomerByCode,
    addCustomer,
    updateCustomerByCode
}