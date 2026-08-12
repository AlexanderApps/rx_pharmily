import { wrapPdfDocument } from "@/shared/utils/pdf";
import { Donation } from "@/features/donations/types/donation.types";

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

// Item list for a donation posting — printed from either the owner's
// management view or the public market view.
export function buildDonationItemListHtml(donation: Donation): string {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const daysUntil = (date: Date) => Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS);

  const itemRows = donation.donatedItems
    .map((item) => {
      const days = daysUntil(item.expiryDate);
      const expiryNote = days < 0 ? " — Expired" : days <= 30 ? " — Expiring soon" : "";
      return `
        <tr>
          <td>${escapeHtml(item.product)}</td>
          <td class="num">${item.quantity}</td>
          <td>${item.batch ? escapeHtml(item.batch) : "-"}</td>
          <td>${fmtDate(item.expiryDate)}${expiryNote}</td>
          <td>${item.isActive ? "Available" : "Claimed / Inactive"}</td>
        </tr>`;
    })
    .join("");

  const body = `
    <h1>Donation Item List</h1>
    <div class="subtitle">${escapeHtml(donation.code)} · <span class="pill" style="background:#dbeafe;color:#1d4ed8;">${escapeHtml(donation.status)}</span></div>

    <h2>Donor</h2>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Facility</div><div class="info-value">${escapeHtml(donation.facilityName)}</div></div>
      <div class="info-item"><div class="info-label">Location</div><div class="info-value">${escapeHtml(donation.facilityLocation)}</div></div>
      <div class="info-item"><div class="info-label">Posted</div><div class="info-value">${fmtDate(donation.createdAt)}</div></div>
      <div class="info-item"><div class="info-label">Categories</div><div class="info-value">${escapeHtml(donation.categories.join(", ") || "-")}</div></div>
    </div>

    <h2>Items (${donation.donatedItems.length})</h2>
    <table>
      <thead><tr><th>Product</th><th class="num">Qty</th><th>Batch</th><th>Expiry</th><th>Status</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    ${donation.termsOfService ? `<h2>Terms</h2><div class="comment-box">${escapeHtml(donation.termsOfService)}</div>` : ""}
    ${donation.comment ? `<h2>Comment</h2><div class="comment-box">${escapeHtml(donation.comment)}</div>` : ""}
  `;

  return wrapPdfDocument(body, "Donation Item List");
}
