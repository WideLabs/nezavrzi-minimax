const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv").config();

const invoicesRoutes = require("./routes/invoicesRoutes");
const stocksRoutes = require("./routes/stocksRoutes");
const organizationsRoutes = require("./routes/organizationsRoutes");

const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use("/invoices", invoicesRoutes);
app.use("/stocks", stocksRoutes);
app.use("/organizations", organizationsRoutes);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
