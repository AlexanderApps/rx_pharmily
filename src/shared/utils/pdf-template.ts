// Pure HTML string generation, no native APIs involved, so this has no
// platform variant — both pdf.ts (native) and pdf.web.ts (web) import
// wrapPdfDocument from here rather than from each other, since cross-
// importing between .ts/.web.ts platform siblings resolves ambiguously
// across bundlers.

// Groundwork for multiple selectable print templates. Only "standard"
// exists today — when more are added, register them here and thread a
// template picker through PrintButton/the calling screens. Every existing
// call site keeps working unchanged since templateId defaults.
export type PdfTemplateId = "standard";

export interface PdfTemplateOptions {
  templateId?: PdfTemplateId;
}

const STANDARD_STYLES = `
  * { box-sizing: border-box; }
  @page {
    size: A4;
    margin: 0 0 14mm 0;
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 9px;
      color: #6b6b76;
    }
  }
  body {
    font-family: -apple-system, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    padding: 32px;
    font-size: 13px;
    line-height: 1.5;
  }
  .brand {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #0066cc;
    padding-bottom: 14px;
    margin-bottom: 20px;
  }
  .brand-name { font-size: 20px; font-weight: 700; color: #0066cc; }
  .brand-sub { font-size: 11px; color: #4a4a54; margin-top: 2px; }
  .doc-meta { text-align: right; font-size: 11px; color: #4a4a54; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #4a4a54;
    margin: 22px 0 8px;
    border-bottom: 1px solid #cfcfd4;
    padding-bottom: 6px;
  }
  .subtitle { color: #4a4a54; font-size: 12px; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #d8d8dc; font-size: 12px; }
  th { color: #4a4a54; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.4px; }
  td.num, th.num { text-align: right; }
  .info-grid { display: flex; flex-wrap: wrap; gap: 0; margin-top: 4px; }
  .info-item { width: 50%; padding: 6px 0; }
  .info-label { font-size: 10px; text-transform: uppercase; color: #55555f; letter-spacing: 0.4px; }
  .info-value { font-size: 13px; font-weight: 600; margin-top: 2px; }
  .pill {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .total-row td { font-weight: 700; border-top: 2px solid #333; border-bottom: none; }
  .comment-box { background: #f2f3f5; border-radius: 8px; padding: 12px; margin-top: 6px; font-size: 12px; }
  .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #d8d8dc; font-size: 10px; color: #5c5c66; text-align: center; }
`;

function renderStandardTemplate(bodyHtml: string, docTitle: string): string {
  return `
    <html>
      <head><meta charset="utf-8" /><style>${STANDARD_STYLES}</style></head>
      <body>
        <div class="brand">
          <div>
            <div class="brand-name">RxPharmily</div>
            <div class="brand-sub">${docTitle}</div>
          </div>
          <div class="doc-meta">Generated ${new Date().toLocaleString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</div>
        </div>
        ${bodyHtml}
        <div class="footer">Generated from the RxPharmily app — for record-keeping purposes.</div>
      </body>
    </html>
  `;
}

const TEMPLATES: Record<PdfTemplateId, (bodyHtml: string, docTitle: string) => string> = {
  standard: renderStandardTemplate,
};

export function wrapPdfDocument(
  bodyHtml: string,
  docTitle: string,
  options: PdfTemplateOptions = {},
): string {
  const templateId = options.templateId ?? "standard";
  const renderer = TEMPLATES[templateId] ?? TEMPLATES.standard;
  return renderer(bodyHtml, docTitle);
}
