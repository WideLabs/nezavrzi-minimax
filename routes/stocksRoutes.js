const express = require("express");
const router = express.Router();
const {
  getStocks,
  getStockForItemById,
  getStockForItemByCode,
} = require("../controllers/stocksController.js");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getStocks);

router.route("/:id").get(protect, getStockForItemById);

router.route("/code/:code").get(protect, getStockForItemByCode);

module.exports = router;
