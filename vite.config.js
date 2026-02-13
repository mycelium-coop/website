import { defineConfig } from "vite";
import contentPlugin from "./vite-plugin-content.js";

export default defineConfig({
  base: "./",
  plugins: [contentPlugin()],
});
