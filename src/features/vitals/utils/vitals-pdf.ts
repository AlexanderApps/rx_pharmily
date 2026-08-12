import { wrapPdfDocument } from "@/shared/utils/pdf";
import { VitalReading } from "@/features/vitals/types/vitals.types";
import { formatVitalValue, vitalTypeLabel } from "@/features/vitals/utils/format-vital";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const fmtDateTime = (d: Date) =>
  new Date(d).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function buildVitalsPdf(readings: VitalReading[], patientName: string, filterSummary?: string): string {
  const sorted = [...readings].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );

  const rows = sorted
    .map(
      (r) => `
        <tr>
          <td>${fmtDateTime(r.recordedAt)}</td>
          <td>${escapeHtml(vitalTypeLabel(r))}</td>
          <td>${escapeHtml(formatVitalValue(r))}</td>
          <td>${r.notes ? escapeHtml(r.notes) : "-"}</td>
        </tr>`,
    )
    .join("");

  const body = `
    <h1>Vital Signs Record</h1>
    <div class="subtitle">
      ${escapeHtml(patientName)} · ${sorted.length} reading${sorted.length === 1 ? "" : "s"}${filterSummary ? ` · ${escapeHtml(filterSummary)}` : ""}
    </div>

    <div class="comment-box" style="border: 1px solid #d97706; background: #fef3c7;">
      <strong>Self-reported home record — not a clinical document.</strong>
      These readings were recorded at home by the patient using RxPharmily's RxVitals feature.
      RxPharmily does not review, interpret, or provide medical advice on any value shown here.
      This record is intended only to give a medical professional a structured view of what the
      patient has measured — all clinical interpretation is theirs to make.
    </div>

    <h2>Readings</h2>
    <table>
      <thead>
        <tr><th>Date &amp; Time</th><th>Type</th><th>Value</th><th>Notes</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  return wrapPdfDocument(body, "RxVitals — Vital Signs Record");
}
