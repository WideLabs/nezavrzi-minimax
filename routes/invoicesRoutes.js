const express = require("express");
const router = express.Router();
const {
  issueInvoice,
  issueInvoiceFromProforma,
} = require("../controllers/invoicesController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").post(protect, issueInvoice);
router.route("/reference").post(protect, issueInvoiceFromProforma);

module.exports = router;
