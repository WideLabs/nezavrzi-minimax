const paymentMethodsRegister = {
  T: {
    PaymentMethodId: 304215,
    Name: "Transakcijski račun",
    Type: "T",
    Usage: "D",
    Default: "D",
  },
  G: {
    PaymentMethodId: 304216,
    Name: "Gotovina",
    Type: "G",
    Usage: "D",
    Default: "D",
  },
  GP: {
    PaymentMethodId: 304217,
    Name: "Gotovina po povzetju",
    Type: "G",
    Usage: "D",
    Default: "N",
  },
  B: {
    PaymentMethodId: 304218,
    Name: "Gotovina preko blagajne",
    Type: "B",
    Usage: "D",
    Default: "N",
  },
  K: {
    PaymentMethodId: 304219,
    Name: "Kartica",
    Type: "K",
    Usage: "D",
    Default: "N",
  },
  D: {
    PaymentMethodId: 304220,
    Name: "Drugo",
    Type: "D",
    Usage: "D",
    Default: "N",
  },
};

module.exports = paymentMethodsRegister;
