module.exports = {
  collectCoverage: true,
  testPathIgnorePatterns: ['node_modules', 'dist', 'temp', 'testsetup.js'],
  setupTestFrameworkScriptFile: "./src/__tests__/testsetup.js",
  collectCoverageFrom: ['src/**/*.js*']
};
