import rollupTypescript from "@rollup/plugin-typescript";
// rollup.config.js
export default {
  // 核心选项
  input: "src/index.ts",
  output: [
    {
      file: "dist/vue3.cjs.js",
      format: "cjs",
    },
    {
      file: "dist/vue3.esm.js",
      format: "esm",
    },
  ],
  plugins: [rollupTypescript()],
};
