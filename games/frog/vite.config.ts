import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "/games/frog/",
  plugins: [react(), tailwindcss()],
  build: { outDir: "../../public/games/frog", emptyOutDir: true },
});
