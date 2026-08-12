// Formats a numeric amount to exactly two decimal places with thousands
// separators, e.g. 1200 -> "1,200.00", 45.5 -> "45.50". Used everywhere a
// rate, cost, or total is displayed — plain toLocaleString()/toString()
// don't guarantee two decimals (1200 renders as "1,200", 45.5 as "45.5").
export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Same as formatAmount but prefixes the currency code, e.g. "GHS 1,200.00".
export function formatCurrency(value: number, currency: string): string {
  return `${currency} ${formatAmount(value)}`;
}
