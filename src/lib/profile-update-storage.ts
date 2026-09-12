import { supabase } from "@/lib/supabase";
import { ProfileUpdateEntityType } from "@/features/profile-updates/types/profile-update.types";
import { readLocalFileBytes } from "@/lib/read-local-file";

const BUCKET = "profile-update-documents";

// Same path shape as kyc-storage.ts's buildStoragePath — entity_type/
// entity_id/filename — checked by the same can_access_kyc_storage_path
// ownership function on the storage RLS side (see the accompanying
// migration), so this must stay in sync with that shape.
function buildStoragePath(entityType: ProfileUpdateEntityType, entityId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${entityType}/${entityId}/${Date.now()}-${safeName}`;
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

// Same native/web split as uploadKycDocumentImage, for the same reason
// — see that function's own comment in lib/kyc-storage.ts for the full
// explanation of why readLocalFileBytes exists at all.
export async function uploadProfileUpdateDocument(
  localUri: string,
  entityType: ProfileUpdateEntityType,
  entityId: string,
  fileName: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  try {
    const bytes = await readLocalFileBytes(localUri);
    const path = buildStoragePath(entityType, entityId, fileName);

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
// reasoning as getKycDocumentSignedUrl.
export async function getProfileUpdateDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data) {
    console.warn("[profile-update-storage] failed to sign url:", error?.message);
    return null;
  }
  return data.signedUrl;
}
