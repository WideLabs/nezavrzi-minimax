const { apiGet } = require("../api/callsApi");
const { apiBaseUrl } = require("../config");
const httpStatusCodes = require("../utils/httpStatusCodes");
const orgId = process.env.organization_id.toString();

// @desc Get stocks for all items of organization
// @route GET /stocks
const getStocks = async (req, res) => {
  const { authToken } = req;
  const pageSize = process.env.stocks_page_size || 100;
  const response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/stocks?PageSize=${pageSize}`,
    authToken
  );

  if (response.statusCode !== httpStatusCodes.OK) {
    return res.status(response.statusCode).json(response);
  }
  // return id, code, quantity
  let items = [];

  response.data.Rows.forEach((row) => {
    items.push({
      id: row.Item.ID,
      code: row.ItemCode,
      quantity: row.Quantity,
      location: row.ItemEANCode,
    });
  });
  return res.status(response.statusCode).json({
    statusCode: httpStatusCodes.OK,
    page: response.data.CurrentPageNumber,
    totalResults: response.data.TotalRows,
    pageSize: response.data.PageSize,
    data: items,
  });
};

// @desc Get stock for item based on item id (not code!)
// @route GET /stocks/:id
const getStockForItemById = async (req, res) => {
  const { authToken } = req;
  const { id } = req.params;
  const response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/stocks/${id}`,
    authToken
  );
  if (response.statusCode !== httpStatusCodes.OK) {
    return res.status(response.statusCode).json(response);
  }
  return res.status(response.statusCode).json({
    statusCode: httpStatusCodes.OK,
    data: !response.data
      ? null
      : {
          id: response.data.Item.ID,
          code: response.data.ItemCode,
          quantity: response.data.Quantity,
        },
  });
};

// @desc Get item by code and then stock for item by id (avoids tracking item ids in db)
// @route GET /stocks/code/:code
const getStockForItemByCode = async (req, res) => {
  const { authToken } = req;
  const { code } = req.params;
  // Get item by code
  const itemResponse = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/items/code(${code})`,
    authToken
  );
  if (itemResponse.statusCode !== httpStatusCodes.OK)
    return res.status(itemResponse.statusCode).json(itemResponse);
  // Get stock for item by ItemId
  const { ItemId } = itemResponse.data;
  const response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/stocks/${ItemId}`,
    authToken
  );
  if (response.statusCode !== httpStatusCodes.OK) {
    return res.status(response.statusCode).json(response);
  }
  return res.status(response.statusCode).json({
    statusCode: httpStatusCodes.OK,
    data: !response.data
      ? null
      : {
          id: response.data.Item.ID,
          code: response.data.ItemCode,
          quantity: response.data.Quantity,
        },
  });
};

module.exports = {
  getStocks,
  getStockForItemById,
  getStockForItemByCode,
};
