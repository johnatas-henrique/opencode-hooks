module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/test", "<rootDir>/.opencode/plugins"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@opencode-ai/plugin$": "<rootDir>/test/__mocks__/plugin.ts",
    "^@opencode-ai/sdk$": "<rootDir>/test/__mocks__/sdk.ts"
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/test/tsconfig.json" }]
  },
  collectCoverageFrom: [
    ".opencode/plugins/opencode-hooks.ts",
    ".opencode/plugins/helpers/**/*.ts",
    "!/**/*.test.ts",
    "!node_modules/**",
    "!.opencode/plugins/types/**"
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 60, functions: 65, lines: 80 }
  },
};
