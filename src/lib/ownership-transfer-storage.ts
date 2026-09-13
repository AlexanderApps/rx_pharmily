import { supabase } from "@/lib/supabase";
import { readLocalFileBytes } from "@/lib/read-local-file";

const BUCKET = "ownership-transfer-documents";

// request_id/filename — checked by can_access_ownership_transfer_document
// on the storage RLS side (see the accompanying migration), so this must
// stay in sync with that shape. Unlike profile-update-storage.ts's
// entity_type/entity_id paths, this is scoped by the request itself: the
// requester isn't yet the entity's owner, so an entity-ownership-based
// path/check wouldn't grant them access to their own upload.
function buildStoragePath(requestId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${requestId}/${Date.now()}-${safeName}`;
}

function guessContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "heic":
      return "image/heic";
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

// Same native/web split as uploadKycDocumentImage/uploadProfileUpdateDocument
// — see lib/kyc-storage.ts's own comment for why readLocalFileBytes exists.
export async function uploadOwnershipTransferDocument(
  localUri: string,
  requestId: string,
  fileName: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  try {
    const bytes = await readLocalFileBytes(localUri);
    const path = buildStoragePath(requestId, fileName);

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

// Private bucket — a signed URL, not a stored public link, same
// reasoning as getProfileUpdateDocumentSignedUrl/getKycDocumentSignedUrl.
export async function getOwnershipTransferDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data) {
    console.warn("[ownership-transfer-storage] failed to sign url:", error?.message);
    return null;
  }
  return data.signedUrl;
}
