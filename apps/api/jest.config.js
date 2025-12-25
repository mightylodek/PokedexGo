module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@pokedex-go/shared$': '<rootDir>/../../../packages/shared/src',
    '^@pokedex-go/shared/(.*)$': '<rootDir>/../../../packages/shared/src/$1',
    '^@pokedex-go/battle-engine$': '<rootDir>/../../../packages/battle-engine/src',
    '^@pokedex-go/battle-engine/(.*)$': '<rootDir>/../../../packages/battle-engine/src/$1',
  },
};

