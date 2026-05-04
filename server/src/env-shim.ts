/**
 * Shim for Vite's import.meta.env used by shared src/ code.
 * The server doesn't serve assets, so BASE_URL is just "/".
 * This must be imported before any shared code that uses import.meta.env.
 */

// Ensure import.meta.env exists for Node.js runtime
if (!(import.meta as any).env) {
  (import.meta as any).env = {}
}
if (!(import.meta as any).env.BASE_URL) {
  (import.meta as any).env.BASE_URL = '/'
}
