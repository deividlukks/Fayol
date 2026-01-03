export const REGEX = {
  // Mínimo 8 caracteres, 1 letra, 1 número e 1 caractere especial
  PASSWORD_COMPLEX: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,

  // Validação de UUID v4
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // Apenas números
  ONLY_NUMBERS: /^\d+$/,

  // Telefone celular BR (com ou sem código do país e DDD)
  PHONE_BR: /^(\+55|55)?\s?(\(?\d{2}\)?)\s?(9\d{4})[-.\s]?(\d{4})$/,

  // Data no formato YYYY-MM-DD
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
};
