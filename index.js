const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv").config();

//Final imports
const itemsRoutes = require("./routes/itemsRoutes");
const customersRoutes = require("./routes/customersRoutes");
const invoicesRoutes = require("./routes/invoicesRoutes");
const stocksRoutes = require("./routes/stocksRoutes");
const organizationsRoutes = require("./routes/organizationsRoutes");

const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use("/items", itemsRoutes);
app.use("/customers", customersRoutes);
app.use("/invoices", invoicesRoutes);
app.use("/stocks", stocksRoutes);
app.use("/organizations", organizationsRoutes);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
