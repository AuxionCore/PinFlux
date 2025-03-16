import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(({ mode }) => ({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "manifest.json", dest: "./" },
        { src: "_locales", dest: "./" },
        { src: "images", dest: "./" },
      ],
    }),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        welcome: "welcomePage/welcome.html",
        whatsNew: "whatsNewPage/whatsNew.html",
        popup: "popup/popup.html",
        serviceWorker: "src-ts/serviceWorker.ts",
        "scripts/displayPinnedChats": "src-ts/scripts/displayPinnedChats.ts",
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
}));
