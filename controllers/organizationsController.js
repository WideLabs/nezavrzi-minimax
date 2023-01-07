const { apiGet } = require("../api/callsApi");
const { apiBaseUrl } = require("../config");
const orgId = process.env.organization_id.toString();

// @desc Get organizations belonging to user specified with mm_user & mm_password in auth token
// @route GET /organizations
const getUserOrganizations = async (req, res) => {
  const { authToken } = req;
  const response = await apiGet(
    `${apiBaseUrl}/api/currentuser/orgs`,
    authToken
  );
  return res.status(response.statusCode).json(response);
};

// @desc Get register of possible payment methods
// @route GET /organizations/paymentMethods
const getPaymentMethods = async (req, res) => {
  const { authToken } = req;
  const response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/paymentMethods`,
    authToken
  );
  return res.status(response.statusCode).json(response);
};

// @desc Get register of possible payment methods (the other way)
// @route GET /organizations/issuedInvoicePaymentMethods
const getIssuedInvoicePaymentMethods = async (req, res) => {
  const { authToken } = req;
  const response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/issuedinvoices/paymentmethods`,
    authToken
  );
  return res.status(response.statusCode).json(response);
};

// @desc Get register of documentNumberings for organization
// @route GET /organizations/documentNumberings
const getDocumentNumberings = async (req, res) => {
  const { authToken } = req;
  const response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/document-numbering`,
    authToken
  );
  return res.status(response.statusCode).json(response);
};

// @desc Get country by code
// @route GET /organizations/countries/code/:code
const getCountryByCode = async (req, res) => {
  const { authToken } = req;
  const { code } = req.params;
  const response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/countries/code(${code})`,
    authToken
  );
  return res.status(response.statusCode).json(response);
};

// @desc Get currency by code
// @route GET /organizations//currencies/code/:code
const getCurrencyByCode = async (req, res) => {
  const { authToken } = req;
  const { code } = req.params;
  const response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/currencies/code(${code})`,
    authToken
  );
  return res.status(response.statusCode).json(response);
};

module.exports = {
  getUserOrganizations,
  getPaymentMethods,
  getIssuedInvoicePaymentMethods,
  getDocumentNumberings,
  getCountryByCode,
  getCurrencyByCode,
};
