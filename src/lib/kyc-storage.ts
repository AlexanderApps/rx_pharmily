import { supabase } from "@/lib/supabase";
import { KycEntityType } from "@/features/profile/types/profile.types";
import { readLocalFileBytes } from "@/lib/read-local-file";

const BUCKET = "kyc-documents";

// Storage paths are entity_type/entity_id/filename — this exact shape is
// what the storage RLS policies (see the kyc_storage migration) check
// ownership against, so don't change it without updating those too.
function buildStoragePath(entityType: KycEntityType, entityId: string, fileName: string) {
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

// Takes whatever local URI expo-image-picker handed back (meaningless
// outside the device that picked it) and uploads it to the private
// kyc-documents bucket, returning the storage path to save on the
// kyc_documents row instead of the local URI.
//
// readLocalFileBytes has a native/web split for exactly this reason: on
// native, @supabase/storage-js can't reliably read React Native's
// Blob/fetch polyfill output ("Creating blobs from 'ArrayBuffer' and
// 'ArrayBufferView' are not supported"), so the native version reads the
// file straight into a Uint8Array via expo-file-system's SDK 54 File
// class instead. On web there's no such polyfill in the way — the
// browser's own Blob/fetch is spec-compliant and works directly.
export async function uploadKycDocumentImage(
  localUri: string,
  entityType: KycEntityType,
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

// kyc_documents.image_uri stores the storage PATH, not a usable URL —
// since the bucket is private, viewing a document means asking Supabase
// for a short-lived signed URL each time, not building a public URL.
export async function getKycDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds = 300,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data) {
    console.warn("[kyc-storage] failed to sign url:", error?.message);
    return null;
  }
  return data.signedUrl;
}

export async function deleteKycDocumentImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) console.warn("[kyc-storage] failed to delete:", error.message);
}
