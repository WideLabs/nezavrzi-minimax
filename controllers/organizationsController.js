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

module.exports = {
  getUserOrganizations,
};
