import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
});
