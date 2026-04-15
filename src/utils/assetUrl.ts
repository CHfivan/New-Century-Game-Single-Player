/**
 * Utility to resolve public asset URLs with the correct base path.
 * This ensures assets work correctly on GitHub Pages where the app
 * is served from a subdirectory (e.g., /New-Century-Game-Single-Player/).
 */

const base = import.meta.env.BASE_URL ?? '/'

/**
 * Prepend the Vite base URL to a public asset path.
 * @param path - Asset path starting with "/" (e.g., "/assets/image/gold_coin.png")
 * @returns Full URL with base path prefix
 */
export function assetUrl(path: string): string {
  // Remove leading slash to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${base}${cleanPath}`
}
