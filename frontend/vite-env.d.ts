/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_RAILWAY_BACKEND_URL?: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'vite' {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string
    readonly VITE_RAILWAY_BACKEND_URL?: string
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
  }
}
