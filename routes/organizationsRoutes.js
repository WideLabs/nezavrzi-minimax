const express = require("express");
const router = express.Router();
const {
  getUserOrganizations,
  getPaymentMethods,
  getIssuedInvoicePaymentMethods,
  getDocumentNumberings,
} = require("../controllers/organizationsController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getUserOrganizations);

router.route("/paymentMethods").get(protect, getPaymentMethods);

router
  .route("/issuedInvoicePaymentMethods")
  .get(protect, getIssuedInvoicePaymentMethods);

router.route("/documentNumberings").get(protect, getDocumentNumberings);

module.exports = router;
