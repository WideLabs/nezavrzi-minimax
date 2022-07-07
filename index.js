const express = require('express')
const bodyParser = require('body-parser')
const dotenv = require('dotenv').config()

//Final imports
const itemsRoute = require('./routes/itemsRoute')
const customersRoute = require('./routes/customersRoute')
const invoicesRoute = require('./routes/invoicesRoute')

const app = express()

const port = process.env.PORT || 3000;

app.use(bodyParser.json())

app.use('/items', itemsRoute)
app.use('/customers', customersRoute)
app.use('/invoices', invoicesRoute)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})