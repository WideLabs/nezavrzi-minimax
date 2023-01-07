const paymentMethodsRegister = {
  TRR: {
    PaymentMethodId: 304215,
    Name: "Transakcijski račun",
    Type: "T",
    Usage: "D",
    Default: "D",
  },
  PYP: {
    PaymentMethodId: 213133,
    Name: "PayPal",
    Code: "PYP",
    Type: "T",
    Usage: "D",
  },
  ODK: {
    PaymentMethodId: 213134,
    Name: "ODKUPNINA",
    Code: "ODK",
    Type: "T",
    Usage: "D",
  },
  PRP: {
    PaymentMethodId: 213141,
    Name: "PREDPLAČILO",
    Code: "PRP",
    Type: "T",
    Usage: "D",
  },
  KRK: {
    PaymentMethodId: 213142,
    Name: "KARTICA",
    Code: "KRK",
    Type: "T",
    Usage: "D",
  },
  GOTOVINA: {
    PaymentMethodId: 213143,
    Name: "GOTOVINA",
    Code: "GOTOVINA",
    Type: "G",
    Usage: "D",
  },
};

module.exports = paymentMethodsRegister;
