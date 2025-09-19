/**
 * Utility functions for URL handling
 */

/**
 * Ensures a URL has a proper protocol (https:// by default)
 * @param url - The URL to normalize
 * @param defaultProtocol - The protocol to use if none is present (default: 'https://')
 * @returns The normalized URL with protocol
 */
export function ensureUrlProtocol(url: string | undefined | null, defaultProtocol: string = 'https://'): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  
  // If URL already has a protocol, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Add the default protocol
  return `${defaultProtocol}${url}`;
}

/**
 * Normalizes a playback URL for consistent display and usage
 * @param url - The playback URL to normalize
 * @returns The normalized URL
 */
export function normalizePlaybackUrl(url: string | undefined | null): string | undefined {
  return ensureUrlProtocol(url, 'https://');
}
