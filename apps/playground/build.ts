import tailwind from "bun-plugin-tailwind";

await Bun.build({
  entrypoints: ["./src/client.tsx"],
  outdir: "./dist",
  plugins: [tailwind],
});
