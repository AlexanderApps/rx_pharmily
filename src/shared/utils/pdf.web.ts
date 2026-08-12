import { wrapPdfDocument } from "@/shared/utils/pdf-template";

export { wrapPdfDocument };

// Replaces the earlier expo-print-based approach — printToFileAsync isn't
// supported on web at all, and printAsync's web behavior wasn't reliable
// enough to depend on. This talks to the browser directly instead: opens
// the rendered HTML in a new tab via a Blob URL, waits for it to actually
// load, then triggers that tab's own native print dialog (which is where
// "Save as PDF" already lives in every desktop browser).
export async function printPdf(html: string) {
  const pdfDocumentUrl = URL.createObjectURL(
    new Blob([`<!DOCTYPE html>${html}`], { type: "text/html" }),
  );
  const popup = window.open(pdfDocumentUrl, "_blank");
  if (!popup) {
    URL.revokeObjectURL(pdfDocumentUrl);
    window.alert("Your browser blocked the print window. Please allow pop-ups and try again.");
    return;
  }
  // Prevents the new tab from holding a reference back to this window
  // (reverse tabnabbing) — standard practice for any window.open target.
  popup.opener = null;
  await new Promise<void>((resolve) => {
    popup.addEventListener(
      "load",
      () => {
        // A short delay after "load" so the popup has actually painted
        // before print() runs — calling it immediately on load can catch
        // the document mid-layout in some browsers.
        window.setTimeout(() => {
          popup.focus();
          popup.print();
          resolve();
        }, 150);
      },
      { once: true },
    );
  });
  popup.addEventListener(
    "afterprint",
    () => {
      URL.revokeObjectURL(pdfDocumentUrl);
    },
    { once: true },
  );
}

// No native share sheet on web — printing (with "Save as PDF") is the
// closest equivalent, so route both entry points to the same place.
export async function exportPdf(html: string, _fileName: string) {
  await printPdf(html);
}

export async function printOrExportPdf(html: string, _fileName: string) {
  await printPdf(html);
}
