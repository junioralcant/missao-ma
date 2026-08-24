import nextJest from 'next/jest.js';

const createJestConfig = nextJest({dir: './'});

const config = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {'^@/(.*)$': '<rootDir>/src/$1'},
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
};

export default createJestConfig(config);
