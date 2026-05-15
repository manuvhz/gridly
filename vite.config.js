import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/gridly/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("three")) return "three";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("firebase")) return "firebase";
          if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("dompurify")) return "pdf";
          if (id.includes("lucide-react")) return "icons";
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 650,
  },
});
