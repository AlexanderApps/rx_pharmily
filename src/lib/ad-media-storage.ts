import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { readLocalFileBytes } from "@/lib/read-local-file";

const BUCKET = "ad-media";

function buildStoragePath(userId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${Date.now()}-${safeName}`;
}

function guessContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

// Uploads a locally-picked image/video to the public ad-media bucket and
// returns a public URL — unlike KYC documents, ad media is meant to be
// visible to anyone browsing the feed once the ad is approved, so no
// signed-URL round trip is needed to view it. Scoped by user rather than
// by ad, since media is picked while composing the ad — before it's
// submitted, before the ads row (and its id) exists at all.
export async function uploadAdMedia(
  localUri: string,
  fileName: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    const bytes = await readLocalFileBytes(localUri);
    const path = buildStoragePath(userId, fileName);

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: guessContentType(fileName),
      upsert: false,
    });

    if (error) return { ok: false, error: error.message };

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { ok: false, error: message };
  }
}
