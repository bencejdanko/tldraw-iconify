/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UNFURLER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
