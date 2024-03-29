const { apiGet, apiPost, apiPut } = require("../api/callsApi");
const httpStatusCodes = require("../utils/httpStatusCodes");
const paymentMethodsRegister = require("../registers/paymentMethodsRegister");
const defaultValuesRegister = require("../registers/defaultValuesRegister");
const { apiBaseUrl } = require("../config");
const {
  customerMandatoryFieldsCheck,
  itemMandatoryFieldsCheck,
} = require("../utils/mandatoryFieldsCheck");
const moment = require("moment");
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

  const dateIssued = new moment();
  let dateDue;
  if (invoiceType === "P") {
    // Pri predračunih dodaj rok zapadlosti
    let proformaExpirationDays = Number(process.env.invoice_expiration_days);
    dateDue = new moment(dateIssued).add(proformaExpirationDays);
  } else {
    dateDue = dateIssued;
  }

  // Connected ID's
  let { countryCode, currencyCode, vatRateCode, employeeId } = req.body;
  let response = undefined;

  let country;
  if (countryCode && countryCode !== defaultValuesRegister.country.Code) {
    // If countryCode is not the same as the default set country
    // Get country data from minimax
    response = await apiGet(
      `${apiBaseUrl}/api/orgs/${orgId}/countries/code(${countryCode})`,
      authToken
    );
    if (response.statusCode !== httpStatusCodes.OK)
      return res.status(response.statusCode).json(response);
    country = response.data;
  } else {
    // Use the default country set in the defaultValuesRegister
    country = defaultValuesRegister.country;
  }

  let currency;
  if (currencyCode && currencyCode !== defaultValuesRegister.currency.Code) {
    // If currencyCode is not the same as the default set currency
    // Get currency data from minimax
    response = await apiGet(
      `${apiBaseUrl}/api/orgs/${orgId}/currencies/code(${currencyCode})`,
      authToken
    );
    if (response.statusCode !== httpStatusCodes.OK)
      return res.status(response.statusCode).json(response);
    currency = response.data;
  } else {
    // Use the default currency set in the defaultValuesRegister
    currency = defaultValuesRegister.currency;
  }

  // VatRate is dependant on date of issuing so always refresh object by calling minimax
  vatRateCode = vatRateCode ? vatRateCode : "S";
  response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/vatrates/code(${vatRateCode})?date=${dateIssued}&countryID=${country.CountryId}`,
    authToken
  );
  if (response.statusCode !== httpStatusCodes.OK)
    return res.status(response.statusCode).json(response);
  const vatRate = response.data;

  let IssuedInvoiceReportTemplate;
  if (invoiceType === "P") {
    // Privzeto nastavljena predloga za tiskane predračune
    IssuedInvoiceReportTemplate =
      defaultValuesRegister.issuedInvoiceReportTemplates.PR;
  } else {
    // Privzeto nastavljena predloga za tiskane izdane račune
    IssuedInvoiceReportTemplate =
      defaultValuesRegister.issuedInvoiceReportTemplates.IR;
  }

  // Privzeto nastavljena predloga za dobavnice
  let DeliveryNoteReportTemplate =
    defaultValuesRegister.deliveryNoteReportTemplate;

  // Privzeto nastavljeno številčenje dokumentov
  let documentNumbering = defaultValuesRegister.documentNumbering;

  // Delavci in skladišče
  let employee = employeeId
    ? { EmployeeId: employeeId }
    : defaultValuesRegister.employee;
  let warehouse = defaultValuesRegister.warehouse;

  if (process.env.NODE_ENV === "DEV") {
    IssuedInvoiceReportTemplate = {};
    DeliveryNoteReportTemplate = {};
    employee = null;
    warehouse = null;
    documentNumbering = null;
  }

  // Get customer info by Code
  response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/customers/code(${customer.Code})`,
    authToken
  );

  let mmCustomer = undefined;
  let isNewCustomer = false;
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
      EInvoiceIssuing: "SeNePripravlja",
    };
    // Create new customer in minimax
    response = await apiPost(
      `${apiBaseUrl}/api/orgs/${orgId}/customers`,
      authToken,
      newCustomer
    );
    if (response.statusCode !== httpStatusCodes.OK) {
      return res.status(response.statusCode).json(response);
    }

    // Create contact for customer
    if (customer.Phone || customer.Email) {
      const newCustomerId = response.data.CustomerId;

      const newContact = {
        Customer: {
          ID: newCustomerId,
        },
        FullName: newCustomer.Name,
        PhoneNumber: customer.Phone ? customer.Phone : null,
        Email: customer.Email ? customer.Email : null,
        Default: "D",
      };

      // No important data is returned so no response
      await apiPost(
        `${apiBaseUrl}/api/orgs/${orgId}/customers/${newCustomerId}/contacts`,
        authToken,
        newContact
      );
    }
    isNewCustomer = true;
  } else if (response.statusCode !== httpStatusCodes.OK) {
    // something else went wrong with get request
    return res.status(response.statusCode).json(response);
  }
  // mmCustomer either found or created successfuly
  mmCustomer = response.data;

  if (!isNewCustomer) {
    // New customers dont need updating.
    let updateNeeded = false;
    for (let [key, value] of Object.entries(customer)) {
      if (mmCustomer[key] && mmCustomer[key] !== value) {
        mmCustomer[key] = value;
        updateNeeded = true;
      }
    }

    // If info is not synced update customer
    if (updateNeeded) {
      response = await apiPut(
        `${apiBaseUrl}/api/orgs/${orgId}/customers/${mmCustomer.CustomerId}`,
        authToken,
        mmCustomer
      );

      if (response.statusCode !== httpStatusCodes.OK)
        return res.status(response.statusCode).json(response);
      response = await apiGet(
        `${apiBaseUrl}/api/orgs/${orgId}/customers/code(${mmCustomer.Code})`,
        authToken
      );

      if (response.statusCode !== httpStatusCodes.OK)
        return res.status(response.statusCode).json(response);
      mmCustomer = response.data;
    }
  }

  const preventItemUpdating =
    process.env.prevent_item_updating === "Y" ? true : false;
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
      if (updateNeeded && !preventItemUpdating) {
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
      Price: mmItem.Price / 1.22, //mmItem.Price, item price without ddv
      PriceWithVAT: mmItem.Price, //itemPriceWithVAT,
      VATPercent: vatRate.Percent,
      Value: mmItem.Price * item.Quantity, //itemPriceWithVATAndQuantity,
      Discount: 0,
      DiscountPercent: 0,
      VatRate: {
        ID: vatRate.VatRateId,
      },
      Warehouse: warehouse
        ? {
            ID: warehouse.WarehouseId,
          }
        : null,
    };
    IssuedInvoiceRows.push(IssuedInvoiceRow);
  }

  const IssuedInvoicePaymentMethods =
    paymentMethodInfo && process.env.NODE_ENV === "PROD"
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
    DocumentNumbering: documentNumbering
      ? {
          ID: documentNumbering.DocumentNumberingId,
        }
      : null,
    DateIssued: dateIssued,
    DateTransaction: dateIssued,
    DateTransactionFrom: dateIssued,
    DateDue: dateDue,
    Currency: {
      ID: currency.CurrencyId,
    },
    IssuedInvoiceReportTemplate: IssuedInvoiceReportTemplate
      ? {
          ID: IssuedInvoiceReportTemplate.ReportTemplateId,
        }
      : null,
    DeliveryNoteReportTemplate: DeliveryNoteReportTemplate
      ? {
          ID: DeliveryNoteReportTemplate.ReportTemplateId,
        }
      : null,
    Employee: employee
      ? {
          ID: employee.EmployeeId,
        }
      : null,
    PricesOnInvoice: "D", // D => VAT included in price, N => VAT is added to the prices,
    InvoiceType: invoiceType ? invoiceType : "R", // R => issued invoice, P => proforma invoice
    IssuedInvoiceRows,
    IssuedInvoicePaymentMethods: IssuedInvoicePaymentMethods,
  };

  response = await apiPost(
    `${apiBaseUrl}/api/orgs/${orgId}/issuedinvoices`,
    authToken,
    invoice
  );
  if (response.statusCode !== httpStatusCodes.OK) {
    console.log(response);
    return res.status(response.statusCode).json(response);
  }

  if (process.env.prevent_invoice_issuing === "Y") {
    return res.status(response.statusCode).json(response);
  }

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

// @desc Issues a new invoice based on a copy of a proforma invoice
// @route POST /reference
const issueInvoiceFromProforma = async (req, res) => {
  const { authToken } = req;
  const { customer, items, documentReference, paymentMethodInfo } = req.body;

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
    if (!items[i].Price && items[i].Code !== "POSTA-PRP") {
      return res.status(httpStatusCodes.BAD_REQUEST).json({
        statusCode: httpStatusCodes.BAD_REQUEST,
        error: `Missing item mandatory field {Price} at index ${i + 1}`,
      });
    }
  }
  if (!documentReference) {
    return res.status(httpStatusCodes.BAD_REQUEST).json({
      statusCode: httpStatusCodes.BAD_REQUEST,
      error: "Missing document reference in request body.",
    });
  }

  const dateIssued = new moment();

  // Connected ID's
  let { countryCode, currencyCode, vatRateCode, employeeId } = req.body;
  let response = undefined;

  let country;
  if (countryCode && countryCode !== defaultValuesRegister.country.Code) {
    // If countryCode is not the same as the default set country
    // Get country data from minimax
    response = await apiGet(
      `${apiBaseUrl}/api/orgs/${orgId}/countries/code(${countryCode})`,
      authToken
    );
    if (response.statusCode !== httpStatusCodes.OK)
      return res.status(response.statusCode).json(response);
    country = response.data;
  } else {
    // Use the default country set in the defaultValuesRegister
    country = defaultValuesRegister.country;
  }

  let currency;
  if (currency && currencyCode !== defaultValuesRegister.currency.Code) {
    // If currencyCode is not the same as the default set currency
    // Get currency data from minimax
    response = await apiGet(
      `${apiBaseUrl}/api/orgs/${orgId}/currencies/code(${currencyCode})`,
      authToken
    );
    if (response.statusCode !== httpStatusCodes.OK)
      return res.status(response.statusCode).json(response);
    currency = response.data;
  } else {
    // Use the default currency set in the defaultValuesRegister
    currency = defaultValuesRegister.currency;
  }

  // VatRate is dependant on date of issuing so always refresh object by calling minimax
  vatRateCode = vatRateCode ? vatRateCode : "S";
  response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/vatrates/code(${vatRateCode})?date=${dateIssued}&countryID=${country.CountryId}`,
    authToken
  );
  if (response.statusCode !== httpStatusCodes.OK)
    return res.status(response.statusCode).json(response);
  const vatRate = response.data;

  // Tukaj se vedno tiska račun na osnovi predračuna
  let IssuedInvoiceReportTemplate =
    defaultValuesRegister.issuedInvoiceReportTemplates.IR;

  // Privzeto nastavljena predloga za dobavnice
  let DOReportTemplate = defaultValuesRegister.deliveryNoteReportTemplate;

  // Privzeto nastavljeno številčenje dokumentov
  let documentNumbering = defaultValuesRegister.documentNumbering;

  // Delavci in skladišče
  let employee = employeeId
    ? { EmployeeId: employeeId }
    : defaultValuesRegister.employee;
  let warehouse = defaultValuesRegister.warehouse;

  if (process.env.NODE_ENV === "DEV") {
    IssuedInvoiceReportTemplate = {};
    DOReportTemplate = {};
    employee = null;
    warehouse = null;
    documentNumbering = null;
  }

  // Get customer info by Code
  // No adding new customers or updating customers
  // Info must be equal to documentReference
  response = await apiGet(
    `${apiBaseUrl}/api/orgs/${orgId}/customers/code(${customer.Code})`,
    authToken
  );
  if (response.statusCode === httpStatusCodes.NOT_FOUND) {
    return res.status(httpStatusCodes.BAD_REQUEST).json({
      statusCode: httpStatusCodes.BAD_REQUEST,
      error: `Customer with Code: {${customer.Code}} not found.`,
    });
  }
  const mmCustomer = response.data;

  let IssuedInvoiceRows = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    response = await apiGet(
      `${apiBaseUrl}/api/orgs/${orgId}/items/code(${item.Code})`,
      authToken
    );
    if (response.statusCode === httpStatusCodes.NOT_FOUND) {
      return res.status(httpStatusCodes.BAD_REQUEST).json({
        statusCode: httpStatusCodes.BAD_REQUEST,
        error: `Item with Code: {${item.Code}} not found.`,
      });
    }
    const mmItem = response.data;
    if (item.Code === "POSTA-PRP") {
      item.Price = mmItem.Price;
    }
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
      Price: item.Price / 1.22, // Price without DDV,
      PriceWithVAT: item.Price,
      VATPercent: vatRate.Percent,
      Value: item.Price * item.Quantity,
      Discount: 0,
      DiscountPercent: 0,
      VatRate: {
        ID: vatRate.VatRateId,
      },
      Warehouse: warehouse
        ? {
            ID: warehouse.WarehouseId,
          }
        : null,
    };
    IssuedInvoiceRows.push(IssuedInvoiceRow);
  }

  const IssuedInvoicePaymentMethods =
    paymentMethodInfo && process.env.NODE_ENV === "PROD"
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
    DocumentNumbering: documentNumbering
      ? {
          ID: documentNumbering.DocumentNumberingId,
        }
      : null,
    DocumentReference: documentReference,
    DateIssued: dateIssued,
    DateTransaction: dateIssued,
    DateTransactionFrom: dateIssued,
    DateDue: dateIssued,
    Currency: {
      ID: currency.CurrencyId,
    },
    IssuedInvoiceReportTemplate: IssuedInvoiceReportTemplate
      ? {
          ID: IssuedInvoiceReportTemplate.ReportTemplateId,
        }
      : null,
    DeliveryNoteReportTemplate: IssuedInvoiceReportTemplate
      ? {
          ID: DOReportTemplate.ReportTemplateId,
        }
      : null,
    Employee: employee
      ? {
          ID: employee.EmployeeId,
        }
      : null,
    PricesOnInvoice: "D", // D => VAT included in price, N => VAT is added to the prices,
    InvoiceType: "R", // R => issued invoice, P => proforma invoice
    IssuedInvoiceRows,
    IssuedInvoicePaymentMethods: IssuedInvoicePaymentMethods,
  };

  response = await apiPost(
    `${apiBaseUrl}/api/orgs/${orgId}/issuedinvoices`,
    authToken,
    invoice
  );
  if (response.statusCode !== httpStatusCodes.OK) {
    console.log(response);
    return res.status(response.statusCode).json(response);
  }

  if (process.env.prevent_invoice_issuing === "Y") {
    return res.status(response.statusCode).json(response);
  }

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
  issueInvoiceFromProforma,
};
