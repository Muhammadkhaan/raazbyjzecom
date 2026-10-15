export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number, currency = 'PKR'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${currency} 0`;
  return `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
}
