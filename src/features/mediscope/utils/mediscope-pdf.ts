import { wrapPdfDocument } from "@/shared/utils/pdf";
import { formatAmount } from "@/shared/utils/format";
import { MediscopeRequest, MediscopeResponse } from "@/features/mediscope/types/mediscope.types";

const fmtDate = (d?: Date) =>
  d
    ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
    : "-";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// A MediScope request plus every response received — printed from the
// owner's management view or (without the internal review context) the
// public market view.
export function buildMediscopeSummaryHtml(
  request: MediscopeRequest,
  responses: MediscopeResponse[],
): string {
  const responseRows = responses
    .map(
      (response) => `
        <tr>
          <td>${escapeHtml(response.vendorFacility)}</td>
          <td>${response.availability === "full" ? "Fully available" : "Partially available"}</td>
          <td>${escapeHtml(response.facilityWhereAvailable)}</td>
          <td class="num">${response.currency} ${formatAmount(response.cost)}</td>
        </tr>`,
    )
    .join("");

  const body = `
    <h1>${escapeHtml(request.product)}</h1>
    <div class="subtitle">${escapeHtml(request.code)} · <span class="pill" style="background:#dbeafe;color:#1d4ed8;">${escapeHtml(request.status)}</span></div>

    <h2>Request Details</h2>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Requested by</div><div class="info-value">${escapeHtml(request.facilityName)}</div></div>
      <div class="info-item"><div class="info-label">Location</div><div class="info-value">${escapeHtml(request.facilityLocation)}</div></div>
      <div class="info-item"><div class="info-label">Posted</div><div class="info-value">${fmtDate(request.createdAt)}</div></div>
      ${
        request.submissionDeadline
          ? `<div class="info-item"><div class="info-label">Deadline</div><div class="info-value">${fmtDate(request.submissionDeadline)}</div></div>`
          : ""
      }
    </div>

    ${request.comment ? `<h2>Comment</h2><div class="comment-box">${escapeHtml(request.comment)}</div>` : ""}

    <h2>Responses (${responses.length})</h2>
    ${
      responses.length > 0
        ? `<table>
            <thead><tr><th>Facility</th><th>Availability</th><th>Where Available</th><th class="num">Cost</th></tr></thead>
            <tbody>${responseRows}</tbody>
          </table>`
        : `<div class="comment-box">No responses received yet.</div>`
    }
  `;

  return wrapPdfDocument(body, "MediScope Request Summary");
}
