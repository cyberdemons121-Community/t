import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        hackathon: "hackathon.html",
        ctf: "ctf.html",
        login: "login.html",
      },
    },
  },
  // Used by `npm start` (Render web service): serve the built site on $PORT,
  // bound to 0.0.0.0 so the platform's port scan can reach it.
  preview: {
    host: true,
    port: Number(process.env.PORT) || 4173,
    strictPort: true,
    // Vite rejects requests whose Host header it does not recognise (403);
    // this site is served under Render's generated domain and custom domains.
    allowedHosts: true,
  },
});
