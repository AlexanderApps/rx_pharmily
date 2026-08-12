import { File } from "expo-file-system";

// Reads a locally-picked file (from expo-image-picker/expo-document-picker,
// a file:// URI on native) into raw bytes, ready to hand straight to
// supabase.storage's upload(). Native-only — expo-file-system has no web
// implementation at all, which is why this has a .web.ts counterpart
// rather than a runtime Platform.OS check: an unconditional import of a
// native-only module can fail to resolve at bundle time on web regardless
// of whether it's actually called, so the platform split needs to happen
// at the file level, not inside a function body.
export async function readLocalFileBytes(uri: string): Promise<Uint8Array> {
  const file = new File(uri);
  return await file.bytes();
}
