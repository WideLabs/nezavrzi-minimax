const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  getCustomerByCode,
  addCustomer,
  updateCustomerByCode,
} = require("../controllers/customersController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getCustomers).post(protect, addCustomer);

router.route("/:id").get(protect, getCustomerById);

router
  .route("/code/:code")
  .get(protect, getCustomerByCode)
  .put(protect, updateCustomerByCode);

module.exports = router;
