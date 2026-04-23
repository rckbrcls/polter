import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  main: {
    resolve: {
      // Resolve workspace packages to their real paths so they are bundled into out/.
      preserveSymlinks: false,
    },
    build: {
      outDir: "out/main",
      rollupOptions: {
        input: {
          index: resolve(rootDir, "src/main/index.ts"),
        },
      },
    },
  },
  preload: {
    resolve: {
      preserveSymlinks: false,
    },
    build: {
      outDir: "out/preload",
      rollupOptions: {
        input: {
          index: resolve(rootDir, "src/preload/index.ts"),
        },
        output: {
          entryFileNames: "[name].js",
        },
      },
    },
  },
  renderer: {
    root: ".",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(rootDir, "src/renderer"),
      },
      preserveSymlinks: false,
    },
    build: {
      outDir: "out/renderer",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          index: resolve(rootDir, "index.html"),
        },
      },
    },
  },
});
