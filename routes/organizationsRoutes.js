const express = require("express");
const router = express.Router();
const {
  getUserOrganizations,
  getPaymentMethods,
  getIssuedInvoicePaymentMethods,
  getDocumentNumberings,
  getCountryByCode,
  getCurrencyByCode,
} = require("../controllers/organizationsController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getUserOrganizations);

router.route("/paymentMethods").get(protect, getPaymentMethods);

router
  .route("/issuedInvoicePaymentMethods")
  .get(protect, getIssuedInvoicePaymentMethods);

router.route("/documentNumberings").get(protect, getDocumentNumberings);

router.route("/currencies/code/:code").get(protect, getCurrencyByCode);

router.route("/countries/code/:code").get(protect, getCountryByCode);

module.exports = router;
