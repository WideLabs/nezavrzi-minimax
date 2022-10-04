const { apiGet} = require('../api/callsApi')
const { apiBaseUrl } = require('../config')
const orgId = process.env.organization_id.toString()

// @desc Get organizations belonging to user specified with mm_user & mm_password in auth token
// @route GET /organizations
const getUserOrganizations = async (req, res) => {
    const {authToken} = req
    const response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/paymentMethods`, authToken)
    return res.status(response.statusCode).json(response)
}

// @desc Get register of possible payment methods
// @route GET /organizations/paymentMethods
const getPaymentMethods = async (req, res) => {
    const {authToken} = req
    const response = await apiGet(`${apiBaseUrl}/api/orgs/${orgId}/paymentMethods`, authToken)
    return res.status(response.statusCode).json(response)
}

module.exports = {
    getUserOrganizations,
    getPaymentMethods
}