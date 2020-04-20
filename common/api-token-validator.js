const TOKEN_LENGTH = 32;
const HEX_SYMBOLS = '0123456789ABCDEFabcdef';

const isHexChar = (h) => {
  return HEX_SYMBOLS.includes(h);
};

const isHexString = (string) => {
  return string.split('').every((char) => isHexChar(char));
};

export const validateToken = (token) => {
  return token &&
    typeof token === 'string' &&
    token.length === TOKEN_LENGTH &&
    isHexString(token);
};
