import next from "eslint-config-next";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...next,
  {
    ignores: ["bank-server/**", "src/generated/**", "generated/**"],
  },
  {
    rules: {
      // React Compiler extras are useful but noisy for existing patterns (hydration flags, theme, localStorage).
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];

export default config;
