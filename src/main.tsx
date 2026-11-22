import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/space-grotesk/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-600.css";
import "@fontsource/space-grotesk/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-500.css";
import "./index.css";
import App from "./App";
import type { PageId } from "./data/site";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const pageAttr = rootElement.dataset.page;
const page: PageId =
  pageAttr === "hackathon" ||
  pageAttr === "hackathon-updates" ||
  pageAttr === "ctf" ||
  pageAttr === "login" ||
  pageAttr === "admin"
    ? pageAttr
    : "home";

createRoot(rootElement).render(
  <StrictMode>
    <App page={page} />
  </StrictMode>,
);
