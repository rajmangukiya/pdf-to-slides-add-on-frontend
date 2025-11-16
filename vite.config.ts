import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile} from "vite-plugin-singlefile";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), viteSingleFile(), tailwindcss()],
  build: {
    outDir: "gs-dist",
    sourcemap: false,
    cssCodeSplit: false, // merge CSS into JS then into HTML
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
