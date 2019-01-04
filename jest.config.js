module.exports = {
    moduleFileExtensions: [
        'js',
        'jsx'
    ],
    transform: {
        '\\.jsx?$': 'babel-jest'
    },
    testPathIgnorePatterns: [
        '<rootDir>/node_modules',
        '<rootDir>/dist',
        '<rootDir>/src/__tests__/*'
    ],
    setupTestFrameworkScriptFile: '<rootDir>/src/__tests__/setup-test.js',
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src/**/*.{js,jsx}'
    ],
    testRegex: '.*\\.spec.(js|jsx)$',
    transformIgnorePatterns: [
        '<rootDir>/node_modules/(?!@elf)'
    ]
};
