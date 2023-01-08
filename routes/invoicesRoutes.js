const express = require("express");
const router = express.Router();
const {
  issueInvoice,
  getIssuedInvoices,
  issueInvoiceFromProforma,
  getIssuedInvoice,
} = require("../controllers/invoicesController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").post(protect, issueInvoice).get(protect, getIssuedInvoices);
router.route("/:id").get(protect, getIssuedInvoice);
router.route("/reference").post(protect, issueInvoiceFromProforma);

module.exports = router;
