import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { readLocalFileBytes } from "@/lib/read-local-file";

const BUCKET = "rxlink-images";
// Signed URLs are for immediate display, not permanent storage — an
// hour comfortably covers viewing a request's details, with room to
// re-fetch if the screen stays open longer than that.
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function guessContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

// Uploads to the PRIVATE rxlink-images bucket and returns the storage
// path — deliberately not a public URL, since this bucket has no public
// URLs to give out. Path is namespaced under the uploader's own user id
// so the bucket's own storage RLS (folder-based ownership) applies.
export async function uploadRxLinkImage(
  localUri: string,
  fileName: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    const bytes = await readLocalFileBytes(localUri);
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: guessContentType(fileName),
      upsert: false,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, path };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { ok: false, error: message };
  }
}

// Resolves a stored path to a short-lived signed URL for display. Call
// this fresh each time a screen needs to show the image — signed URLs
// expire, so they're never stored anywhere, only the path is.
export async function getRxLinkImageSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) {
    console.warn("[rxlink] getRxLinkImageSignedUrl failed:", error?.message);
    return null;
  }
  return data.signedUrl;
}

// Batch variant — resolves several paths in parallel, used when a
// request's full image list needs to be displayed at once.
export async function getRxLinkImageSignedUrls(paths: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    paths.map(async (path) => [path, await getRxLinkImageSignedUrl(path)] as const),
  );
  const result: Record<string, string> = {};
  for (const [path, url] of entries) {
    if (url) result[path] = url;
  }
  return result;
}
