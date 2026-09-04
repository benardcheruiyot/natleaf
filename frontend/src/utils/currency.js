function normalizeCents(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return amount;
}

export function formatCents(value, currencyPrefix) {
  const cents = normalizeCents(value);
  return `${currencyPrefix}${(cents / 100).toFixed(2)}`;
}

export function formatUsdCents(value) {
  return formatCents(value, '$');
}

export function formatKShCents(value) {
  return formatUsdCents(value);
}

export function formatRpCents(value) {
  return formatUsdCents(value);
}
