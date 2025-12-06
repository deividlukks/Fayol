export const LIMITS = {
  USER: {
    NAME_MIN: 2,
    NAME_MAX: 100,
    PASSWORD_MIN: 8,
    PASSWORD_MAX: 64,
  },
  TRANSACTION: {
    DESCRIPTION_MAX: 255,
    NOTES_MAX: 1000,
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 999999999.99, // Quase 1 bilhão
  },
  ACCOUNT: {
    NAME_MIN: 3,
    NAME_MAX: 50,
  },
  CATEGORY: {
    NAME_MIN: 3,
    NAME_MAX: 50,
  },
};
//# sourceMappingURL=validation.constants.js.map
