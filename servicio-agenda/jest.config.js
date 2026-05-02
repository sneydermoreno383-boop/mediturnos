module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    roots: ['<rootDir>/src'],
    testMatch: ['**/?(*.)+(spec|test).js'],
    moduleFileExtensions: ['js'],
    coverageDirectory: '<rootDir>/coverage',
    collectCoverageFrom: [
    'controllers/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    '!**/*.test.js'
    ],
    coverageThreshold: {
    global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
    }
    },
    verbose: true
};