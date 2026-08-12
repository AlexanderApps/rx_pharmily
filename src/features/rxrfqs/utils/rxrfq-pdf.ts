import { wrapPdfDocument } from "@/shared/utils/pdf";
import { formatAmount } from "@/shared/utils/format";
import {
  Facility,
  RxRfqMarketPlaceData,
  RxRfqResponseData,
  RxRfqsData,
} from "@/features/rxrfqs/hooks/use-rxrfq-data";
import { Product } from "@/features/catalog/types/catalog.types";

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

// These builders are plain functions (no hooks), so the caller — which
// already has the catalog/facility data from its own store subscriptions —
// passes in the resolved lookups rather than the builder reaching into a
// store itself.
function productName(products: Product[], productId: string): string {
  return products.find((p) => p.id === productId)?.name ?? "Unknown product";
}

// A single vendor's quote — printed from the response details screen.
export function buildRfqQuoteHtml(
  rfq: RxRfqMarketPlaceData | RxRfqsData,
  response: RxRfqResponseData,
  facility: Facility | undefined,
  products: Product[],
): string {
  const itemRows = response.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(productName(products, item.productId))}${item.offeredAlternative ? ' <span class="pill" style="background:#fef3c7;color:#92400e;">Alternative</span>' : ""}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${response.currency} ${formatAmount(item.rate)}</td>
          <td class="num">${response.currency} ${formatAmount(item.amount)}</td>
        </tr>`,
    )
    .join("");

  const costRows = response.additionalCosts
    .map(
      (cost) => `
        <tr>
          <td colspan="3">${escapeHtml(cost.description)}${!cost.isRequired ? " (optional)" : ""}</td>
          <td class="num">${response.currency} ${formatAmount(cost.amount)}</td>
        </tr>`,
    )
    .join("");

  const body = `
    <h1>Vendor Quote</h1>
    <div class="subtitle">${escapeHtml(rfq.code)} · ${escapeHtml(response.vendorFacility)}</div>

    <h2>RFQ Details</h2>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Requested by</div><div class="info-value">${escapeHtml(facility?.name ?? "Unknown facility")}</div></div>
      <div class="info-item"><div class="info-label">Location</div><div class="info-value">${escapeHtml(facility?.location ?? "-")}</div></div>
      <div class="info-item"><div class="info-label">Quote valid until</div><div class="info-value">${fmtDate(response.quoteValidUntil)}</div></div>
      <div class="info-item"><div class="info-label">Estimated delivery</div><div class="info-value">${fmtDate(response.estimatedDeliveryDate)}</div></div>
      <div class="info-item"><div class="info-label">Incoterms</div><div class="info-value">${escapeHtml(response.incoterms || "-")}</div></div>
      <div class="info-item"><div class="info-label">Payment terms</div><div class="info-value">${escapeHtml(response.paymentTerms || "-")}</div></div>
    </div>

    <h2>Items</h2>
    <table>
      <thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
      <tbody>
        ${itemRows}
        ${costRows}
        <tr class="total-row">
          <td colspan="3">Grand Total</td>
          <td class="num">${response.currency} ${formatAmount(response.grandTotal)}</td>
        </tr>
      </tbody>
    </table>

    ${
      response.vendorComment
        ? `<h2>Vendor Comment</h2><div class="comment-box">${escapeHtml(response.vendorComment)}</div>`
        : ""
    }
  `;

  return wrapPdfDocument(body, "RxRFQ Vendor Quote");
}

// Full RFQ with every response — printed from the owner's details screen.
export function buildRfqSummaryHtml(
  rfq: RxRfqsData,
  responses: RxRfqResponseData[],
  facility: Facility | undefined,
  products: Product[],
): string {
  const itemRows = rfq.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(productName(products, item.productId))}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${escapeHtml(item.uom)}</td>
        </tr>`,
    )
    .join("");

  const responseRows = responses
    .map(
      (response) => `
        <tr>
          <td>${escapeHtml(response.vendorFacility)}</td>
          <td class="num">${response.items.length}</td>
          <td class="num">${response.currency} ${formatAmount(response.grandTotal)}</td>
          <td class="num">${fmtDate(response.submittedAt)}</td>
        </tr>`,
    )
    .join("");

  const body = `
    <h1>${escapeHtml(rfq.description || rfq.code)}</h1>
    <div class="subtitle">${escapeHtml(rfq.code)} · <span class="pill" style="background:#dbeafe;color:#1d4ed8;">${escapeHtml(rfq.status)}</span></div>

    <h2>Request Details</h2>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Facility</div><div class="info-value">${escapeHtml(facility?.name ?? "Unknown facility")}</div></div>
      <div class="info-item"><div class="info-label">Submission deadline</div><div class="info-value">${fmtDate(rfq.submissionDeadline)}</div></div>
      <div class="info-item"><div class="info-label">Currency</div><div class="info-value">${escapeHtml(rfq.currency)}</div></div>
      <div class="info-item"><div class="info-label">Incoterms</div><div class="info-value">${escapeHtml(rfq.incoterms || "-")}</div></div>
    </div>

    <h2>Requested Items (${rfq.items.length})</h2>
    <table>
      <thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Unit</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    <h2>Responses (${responses.length})</h2>
    ${
      responses.length > 0
        ? `<table>
            <thead><tr><th>Vendor</th><th class="num">Items</th><th class="num">Total</th><th class="num">Submitted</th></tr></thead>
            <tbody>${responseRows}</tbody>
          </table>`
        : `<div class="comment-box">No responses received yet.</div>`
    }

    ${rfq.comment ? `<h2>Notes</h2><div class="comment-box">${escapeHtml(rfq.comment)}</div>` : ""}
  `;

  return wrapPdfDocument(body, "RxRFQ Summary");
}
