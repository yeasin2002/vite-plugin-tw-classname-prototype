export default [
  {
    ignores: ["dist/**", "node_modules/**", "*.config.*"],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "off",
    },
  },
];
