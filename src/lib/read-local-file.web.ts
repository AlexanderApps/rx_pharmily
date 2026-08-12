// On web, expo-image-picker/expo-document-picker hand back a blob: object
// URL rather than a file:// path — the browser already has the bytes in
// memory, so fetching that URL and reading it as a Blob is the standard,
// zero-dependency way to get at them. supabase-js's upload() accepts a
// Blob directly, the same as it accepts the Uint8Array the native version
// produces, so callers don't need to care which platform they're on.
export async function readLocalFileBytes(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return await response.blob();
}
