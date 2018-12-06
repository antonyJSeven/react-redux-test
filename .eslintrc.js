module.exports = {
  "extends": "airbnb",
  "parser": "babel-eslint",
  "env": {
    "browser": true
  },
  "rules": {
    "comma-dangle": ["off", "always-multiline"],
    "react/jsx-one-expression-per-line": [true,  {"allow": "single-child"}]
  }
};
