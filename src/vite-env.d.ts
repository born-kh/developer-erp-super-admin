/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected via vite.config.ts `define` — true only for builds run on Vercel.
declare const __IS_VERCEL__: boolean;
