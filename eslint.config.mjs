import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const ignores = [
  ".next/**",
  "node_modules/**",
  "next-env.d.ts",
  "out/**",
  "dist/**",
];

export default [
  { ignores },
  ...nextVitals,
  ...nextTypescript,
];
