const { apiGet, apiPost, apiPut } = require("../api/callsApi");
const httpStatusCodes = require("../utils/httpStatusCodes");
const paymentMethodsRegister = require("../utils/paymentMethodsRegister");
const { apiBaseUrl } = require("../config");
const {
  customerMandatoryFieldsCheck,
  itemMandatoryFieldsCheck,
} = require("../utils/mandatoryFieldsCheck");
const orgId = process.env.organization_id.toString();

// @desc Issue new invoice
// @route POST /invoices
const issueInvoice = async (req, res) => {
  const { authToken } = req;
  const { customer, items, paymentMethodInfo, invoiceType } = req.body;
  if (!customer) {
    return res.status(httpStatusCodes.BAD_REQUEST).json({
      statusCode: httpStatusCodes.BAD_REQUEST,
      error: "Missing customer in request body.",
    });
  }
  if (!customer.Code) {
    return res.status(httpStatusCodes.BAD_REQUEST).json({
      statusCode: httpStatusCodes.BAD_REQUEST,
      error: "Missing customer mandatory field {Code}",
    });
  }
  if (!items || items.length < 1) {
    return res.status(httpStatusCodes.BAD_REQUEST).json({
      statusCode: httpStatusCodes.BAD_REQUEST,
      error: "Missing items in request body.",
    });
  }
  for (let i = 0; i < items.length; i++) {
    if (!items[i].Code) {
      return res.status(httpStatusCodes.BAD_REQUEST).json({
        statusCode: httpStatusCodes.BAD_REQUEST,
        error: `Missing item mandatory field {Code} at index ${i + 1}`,
      });
    }
    if (!items[i].Quantity) {
      return res.status(httpStatusCodes.BAD_REQUEST).json({
        statusCode: httpStatusCodes.BAD_REQUEST,
        error: `Missing item mandatory field {Quantity} at index ${i + 1}`,
      });
    }
  }

  const date = new Date();

  // Connected ID's
  let {
    countryCode,
    currencyCode,
    vatRateCode,
    IRReportTemplateCode,
    DOReportTemplateCode,
  } = req.body;
  let response = undefined;
  countryCode = countryCode ? countryCode : "SI";
  currencyCode = currencyCode ? currencyCode : "EUR";
  vatRateCode = vatRateCode ? vatRateCode : "S";
  IRReportTemplateCode = IRReportTemplateCode ? IRReportTemplateCode : "IR";
  DOReportTemplateCode = DOReportTemplateCode ? DOReportTemplateCode : "DO";
  // Country data
  response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/countries/code(${countryCode})`,
    authToken
  );
  if (response.statusCode !== httpStatusCodes.OK)
    return res.status(response.statusCode).json(response);
  const country = response.data;
  // Currency data
  response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/currencies/code(${currencyCode})`,
    authToken
  );
  if (response.statusCode !== httpStatusCodes.OK)
    return res.status(response.statusCode).json(response);
  const currency = response.data;
  // Vatrate data
  response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/vatrates/code(${vatRateCode})?date=${date}&countryID=${country.CountryId}`,
    authToken
  );
  if (response.statusCode !== httpStatusCodes.OK)
    return res.status(response.statusCode).json(response);
  const vatRate = response.data;
  // IRReport Template data
  response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/report-templates?SearchString=${IRReportTemplateCode}&PageSize=100`,
    authToken
  );
  if (response.statusCode !== httpStatusCodes.OK)
    return res.status(response.statusCode).json(response);
  const IRReportTemplate = response.data;
  // DOReport Template data
  response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/report-templates?SearchString=${DOReportTemplateCode}&PageSize=100`,
    authToken
  );
  if (response.statusCode !== httpStatusCodes.OK)
    return res.status(response.statusCode).json(response);
  const DOReportTemplate = response.data;

  // Get customer info by Code
  response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/customers/code(${customer.Code})`,
    authToken
  );
  let mmCustomer = undefined;

  if (response.statusCode === httpStatusCodes.NOT_FOUND) {
    // Customer with that code doesnt exist yet, create new one
    // Check if customer contains all mandatory fields
    const customerMissingMandatoryFields =
      customerMandatoryFieldsCheck(customer);
    if (customerMissingMandatoryFields.length > 1) {
      return res.status(httpStatusCodes.BAD_REQUEST).json({
        statusCode: httpStatusCodes.BAD_REQUEST,
        error: `Customer not found and can't create new customer. Missing mandatory customer fields {${customerMissingMandatoryFields.toString()}}`,
      });
    }
    const newCustomer = {
      Code: customer.Code,
      Name: customer.Name,
      Address: customer.Address,
      PostalCode: customer.PostalCode,
      City: customer.City,
      Country: {
        ID: country.CountryId,
      },
      CountryName: country.Code === "SI" ? null : country.Name,
      SubjectToVAT: customer.SubjectToVAT ? customer.SubjectToVAT : "N",
      VATIdentificationNumber: customer.VATIdentificationNumber
        ? customer.VATIdentificationNumber
        : null,
      Currency: {
        ID: currency.CurrencyId,
      },
      EInvoiceIssuing: "SeNePripravlja", //KAJ Z TEM?
    };
    // Create new customer in minimax
    response = await apiPost(
      `${apiBaseUrl}/api/orgs/${orgId}/customers`,
      authToken,
      newCustomer
    );
    if (response.statusCode !== httpStatusCodes.OK)
      return res.status(response.statusCode).json(response);
    // Create contact for customer
    const newContact = {
      Customer: {
        ID: newCustomer.CustomerId,
      },
      FullName: newCustomer.Name,
      PhoneNumber: customer.Phone ? customer.Phone : null,
      Email: customer.Email ? customer.Email : null,
      Default: "D",
    };
    // No important data is returned so no await
    apiPost(
      `${apiBaseUrl}/api/orgs/${orgId}/customers/${newCustomer.CustomerId}/contacts`,
      authToken,
      newContact
    );
  } else if (response.statusCode !== httpStatusCodes.OK) {
    // something else went wrong with get request
    return res.status(response.statusCode).json(response);
  }
  mmCustomer = response.data;
  //TODO customer updating??

  let IssuedInvoiceRows = [];
  for (let i = 0; i < items.length; i++) {
    // item => admin page item object, mmItem => minimax item object
    const item = items[i];
    response = await apiGet(
      `${apiBaseUrl}/api/orgs/${orgId}/items/code(${item.Code})`,
      authToken
    );
    let isNewItem = false;
    // Item with that code doesnt exist yet, create new one
    if (response.statusCode === httpStatusCodes.NOT_FOUND) {
      isNewItem = true;
      // Create new item
      const itemMissingMandatoryFields = itemMandatoryFieldsCheck(item);
      if (itemMissingMandatoryFields.length > 1) {
        return res.status(httpStatusCodes.BAD_REQUEST).json({
          statusCode: httpStatusCodes.BAD_REQUEST,
          error: `Existing item not found and can't create new item. Missing mandatory customer fields {${itemMissingMandatoryFields.toString()}}`,
        });
      }
      const newItem = {
        Code: item.Code,
        Name: item.Name,
        Description: item.Description ? item.Description : null,
        ItemType: item.ItemType ? item.ItemType : "B",
        StocksManagedOnlyByQuantity: item.StocksManagedOnlyByQuantity
          ? item.StocksManagedOnlyByQuantity
          : "N",
        UnitOfMeasurement: item.UnitOfMeasurement
          ? item.UnitOfMeasurement
          : "KOM",
        VatRate: {
          ID: vatRate.VatRateId,
        },
        Price: item.Price,
        Currency: {
          ID: currency.CurrencyId,
        },
      };
      response = await apiPost(
        `${apiBaseUrl}/api/orgs/${orgId}/items`,
        authToken,
        newItem
      );
    }
    if (response.statusCode !== httpStatusCodes.OK)
      return res.status(response.statusCode).json(response);
    let mmItem = response.data;
    // New items dont need updating
    if (!isNewItem) {
      // Check if info is synced between item and mmItem
      let updateNeeded = false;
      for (let [key, value] of Object.entries(item)) {
        if (mmItem[key] && mmItem[key] !== value) {
          mmItem[key] = value;
          updateNeeded = true;
        }
      }

      // If info is not synced update item
      if (updateNeeded) {
        response = await apiPut(
          `${apiBaseUrl}/api/orgs/${orgId}/items/${mmItem.ItemId}`,
          authToken,
          mmItem
        );
        if (response.statusCode !== httpStatusCodes.OK)
          return res.status(response.statusCode).json(response);
        response = await apiGet(
          `${apiBaseUrl}/api/orgs/${orgId}/items/code(${mmItem.Code})`,
          authToken
        );
        if (response.statusCode !== httpStatusCodes.OK)
          return res.status(response.statusCode).json(response);
        mmItem = response.data;
      }
    }
    const itemDDV = parseFloat(
      Number(mmItem.Price * (vatRate.Percent / 100)).toFixed(2)
    );
    const itemPriceWithVAT = parseFloat(
      Number(mmItem.Price + itemDDV).toFixed(2)
    );
    const itemPriceWithVATAndQuantity =
      item.Quantity === 1
        ? itemPriceWithVAT
        : parseFloat(Number(itemPriceWithVAT * item.Quantity).toFixed(2));
    const IssuedInvoiceRow = {
      RowNumber: i + 1,
      Item: {
        ID: mmItem.ItemId,
      },
      ItemName: mmItem.Name,
      ItemCode: mmItem.Code,
      UnitOfMeasurement: mmItem.UnitOfMeasurement,
      Description: mmItem.Description,
      Quantity: item.Quantity,
      Price: mmItem.Price,
      PriceWithVAT: itemPriceWithVAT,
      VATPercent: vatRate.Percent,
      Value: itemPriceWithVATAndQuantity,
      Discount: 0,
      DiscountPercent: 0,
      VatRate: {
        ID: vatRate.VatRateId,
      },
    };
    IssuedInvoiceRows.push(IssuedInvoiceRow);
  }

  const IssuedInvoicePaymentMethods = paymentMethodInfo
    ? [
        {
          PaymentMethod: {
            ID: paymentMethodsRegister[paymentMethodInfo.paymentMethod]
              .PaymentMethodId,
          },
          Amount: paymentMethodInfo.amount,
          AlreadyPaid: paymentMethodInfo.alreadyPaid ? "D" : "N",
        },
      ]
    : null;

  // Generate invoice object
  const invoice = {
    Customer: {
      ID: mmCustomer.CustomerId,
    },
    DateIssued: date,
    DateTransaction: date,
    DateTransactionFrom: date,
    DateDue: date,
    Currency: {
      ID: currency.CurrencyId,
    },
    IssuedInvoiceReportTemplate: {
      ID: IRReportTemplate.ReportTemplateId,
    },
    DeliveryNoteReportTemplate: {
      ID: DOReportTemplate.ReportTemplateId,
    },
    PricesOnInvoice: "N", // D => VAT included in price, N => VAT is added to the prices,
    InvoiceType: invoiceType ? invoiceType : "R", // R => issued invoice, P => proforma invoice
    IssuedInvoiceRows,
    //IssuedInvoicePaymentMethods
  };
  response = await apiPost(
    `${apiBaseUrl}/api/orgs/${orgId}/issuedinvoices`,
    authToken,
    invoice
  );
  if (response.statusCode !== httpStatusCodes.OK)
    return res.status(response.statusCode).json(response);
  const { IssuedInvoiceId, RowVersion } = response.data;
  const actionName = "issueAndGeneratepdf";

  // Issue invoice and generate pdf
  response = await apiPut(
    `${apiBaseUrl}/api/orgs/${orgId}/issuedinvoices/${IssuedInvoiceId}/actions/${actionName}?rowVersion=${RowVersion}`,
    authToken,
    null
  );
  if (response.statusCode !== httpStatusCodes.OK)
    return res.status(response.statusCode).json(response);

  return res.status(httpStatusCodes.OK).json(response);
};

module.exports = {
  issueInvoice,
};
