import typescript from "@rollup/plugin-typescript";
export default {
  input: "src/main.ts",
  output: [
    {
      file: "lib/esm.js",
      format: "es",
    },
    {
      file: "lib/cjs.js",
      format: "cjs",
    },
  ],
  plugins: [typescript()],
};
