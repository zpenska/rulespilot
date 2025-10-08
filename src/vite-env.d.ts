/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY: string
  readonly VITE_ENABLE_CHAT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
