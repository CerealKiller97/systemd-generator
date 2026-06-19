import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const umamiOrigin = "https://analytics.stefanbogdanovic.dev";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      strict: true,
    }),
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    csp: {
      mode: "auto",
      directives: {
        "default-src": ["self"],
        "script-src": ["self", umamiOrigin],
        "style-src": ["self", "unsafe-inline"],
        "font-src": ["self"],
        "img-src": ["self", "data:"],
        "connect-src": ["self", umamiOrigin],
        "frame-ancestors": ["self"],
        "base-uri": ["self"],
        "form-action": ["self"],
        "object-src": ["none"],
      },
    },
  },
};

export default config;
