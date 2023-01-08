const express = require("express");
const router = express.Router();
const {
  getUserOrganizations,
} = require("../controllers/organizationsController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getUserOrganizations);

module.exports = router;
