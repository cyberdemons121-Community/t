import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        hackathon: "hackathon.html",
        hackathonUpdates: "hackathon-updates.html",
        ctf: "ctf.html",
        login: "login.html",
      },
    },
  },
  // Local dev: send API calls to the Express server.
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 4173,
    strictPort: true,
    // Vite rejects requests whose Host header it does not recognise (403);
    // this site is served under Render's generated domain and custom domains.
    allowedHosts: true,
  },
});
