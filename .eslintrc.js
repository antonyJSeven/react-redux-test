module.exports = {
  "extends": "airbnb",
  "parser": "babel-eslint",
  "env": {
    "browser": true,
    "jest": true
  },
  "rules": {
    "comma-dangle": ["off", "always-multiline"],
    "react/jsx-one-expression-per-line": [true,  {"allow": "single-child"}],
    "camelcase": ["error", {allow: ["^DOM"]}]
  }
};
