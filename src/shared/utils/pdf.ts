import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import { wrapPdfDocument } from "@/shared/utils/pdf-template";

// Shared print/export-to-PDF plumbing used across RxRFQs, Donations, and
// MediScope. Each feature builds its own HTML string (see the per-feature
// pdf-template files) and hands it to one of these two entry points.

export { wrapPdfDocument };

// Renders the given HTML to a PDF file and opens the native print dialog
// (which on most platforms also offers "Save as PDF" / share directly).
export async function printPdf(html: string) {
  try {
    await Print.printAsync({ html });
  } catch (error) {
    Alert.alert("Couldn't print", "Something went wrong opening the print dialog. Try again.");
  }
}

// Renders the given HTML to a PDF file and opens the share sheet so the
// user can save it, send it, or print it. Preferred on Android, where the
// print dialog is less consistently available than iOS's AirPrint sheet.
export async function exportPdf(html: string, fileName: string) {
  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        "Sharing unavailable",
        "This device can't share files. The PDF was generated but couldn't be opened.",
      );
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: fileName,
      UTI: "com.adobe.pdf",
    });
  } catch (error) {
    Alert.alert("Couldn't export PDF", "Something went wrong generating the file. Try again.");
  }
}

// Convenience: on iOS prefer the native print dialog (which also offers
// Save to Files), on Android go straight to the share sheet since the
// system print flow is less universally wired up there.
export async function printOrExportPdf(html: string, fileName: string) {
  if (Platform.OS === "ios") {
    await printPdf(html);
  } else {
    await exportPdf(html, fileName);
  }
}
