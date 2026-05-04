/**
 * Type declarations for Vite's import.meta.env
 * Needed because shared src/ code references import.meta.env.BASE_URL
 */

interface ImportMetaEnv {
  readonly BASE_URL: string
  [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
