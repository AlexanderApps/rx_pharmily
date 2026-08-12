import { supabase } from "@/lib/supabase";
import { requireUserId } from "@/lib/supabase-store-helpers";
import { readLocalFileBytes } from "@/lib/read-local-file";

const BUCKET = "app-images";

function buildStoragePath(context: string, userId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${context}/${userId}/${Date.now()}-${safeName}`;
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

// Uploads a locally-picked image or video to the shared public
// app-images bucket and returns a public URL. `context` is just a folder
// label for organization (e.g. "mediscope", "formulary", "chat") — it
// doesn't gate access, the bucket itself is public and RLS only checks
// the uploader.
export async function uploadAppImage(
  localUri: string,
  context: string,
  fileName: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const userId = await requireUserId();
    const bytes = await readLocalFileBytes(localUri);
    const path = buildStoragePath(context, userId, fileName);

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
