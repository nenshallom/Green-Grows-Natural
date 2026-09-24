/**
 * Standardized Formatting Utilities for GGN Platform
 */

interface FormatNairaOptions {
  showSymbol?: boolean;
  decimals?: number;
  fallback?: string;
}

/**
 * Format a number or numeric string to Nigerian Naira (₦) currency format.
 * Examples:
 *   formatNaira(1500) => "₦1,500"
 *   formatNaira(1500, { showSymbol: false }) => "1,500"
 *   formatNaira(null) => "₦0"
 */
export function formatNaira(
  amount: number | string | null | undefined,
  options: FormatNairaOptions = {}
): string {
  const { showSymbol = true, decimals = 0, fallback = showSymbol ? '₦0' : '0' } = options;

  if (amount === null || amount === undefined || amount === '') {
    return fallback;
  }

  const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericValue) || !isFinite(numericValue)) {
    return fallback;
  }

  const formatted = numericValue.toLocaleString('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `₦${formatted}` : formatted;
}

/**
 * Format price per unit string.
 * Example: formatPriceWithUnit(2500, 'kg') => "₦2,500 / kg"
 */
export function formatPriceWithUnit(
  price: number | string | null | undefined,
  unit?: string | null
): string {
  const formattedPrice = formatNaira(price);
  if (!unit) return formattedPrice;
  return `${formattedPrice} / ${unit}`;
}

/**
 * Safely extract a readable error message from any caught error.
 */
export function getErrorMessage(error: unknown, defaultMessage = 'An unexpected error occurred'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return defaultMessage;
}

/**
 * Format timestamp to a localized Nigerian date-time string.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

