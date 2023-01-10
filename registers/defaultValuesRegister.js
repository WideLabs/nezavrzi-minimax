// Register privzetih nastavitev na minimax api-ju za klice v Minimax podjetja Nezavrzi.si
// Nekatere vrednosti so dodane le za branje
// Pomembne vrednosti v objektih so označene z // !

const defaultValuesRegister = {
  employee: {
    EmployeeId: 360106, // !
    FirstName: "TIMOTEJ",
    LastName: "KOLAR",
    DateOfBirth: "1988-10-13T00:00:00",
    TaxNumber: "69965153",
  },
  warehouse: {
    WarehouseId: 19090, // !
    Code: "1",
    Name: "Skladišče MP",
    Location: null,
    InventoryManagement: "Prodajna",
    InventoryManagementByValue: "D",
    InventoryBookkeping: "Nabavna",
    Usage: "D",
  },
  documentNumbering: {
    DocumentNumberingId: 33859, // !
    Document: "IR",
    Code: "139-3",
    Name: "Davčno potrjevanje računov",
    Default: "N",
    ReferenceNumber: "00",
    Usage: "D",
  },
  issuedInvoiceReportTemplates: {
    IR: {
      ReportTemplateId: 316602, // !
      Name: "Standardno - Izdan račun",
      DisplayType: "IR",
      Default: "D",
    },
    PR: {
      ReportTemplateId: 316604, // !
      Name: "Standardno - Predračun",
      DisplayType: "PR",
      Default: "D",
    },
  },
  deliveryNoteReportTemplate: {
    ReportTemplateId: 316598, // !
    Name: "Standardno - Dobavnica",
    DisplayType: "DO",
    Default: "D",
  },
  country: {
    CountryId: 192, // !
    Code: "SI", // !
    Name: "SLOVENIJA", // !
  },
  currency: {
    CurrencyId: 7, // !
    Code: "EUR", // !
    Name: "Evro",
  },
};

module.exports = defaultValuesRegister;
