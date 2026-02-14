import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "chart-vendor": ["recharts"],
          "icon-vendor": ["react-icons"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "toast-vendor": ["react-toastify"],
        },
      },
    },
  },
  server: { port: 3000 },
  base: "/Alhadikah_Ramadan",
});
