import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import App from "./App";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "./i18n/LanguageContext";
import "./index.css";

// StrictMode intentionally double-invokes effects in dev, which double-fires
// every data-fetching effect on mount (visible as duplicate network requests
// and a "loads twice" flicker). Not worth it for this app — disabled.
createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="sa-theme">
    <LanguageProvider>
      <BrowserRouter>
        <App />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </LanguageProvider>
  </ThemeProvider>,
);
