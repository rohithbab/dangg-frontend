/**
 * Stateless display formatters. JS-only — no platform `Intl.NumberFormat`
 * dependencies (Hermes ICU support is patchy across Android variants).
 */

/** `1234.5` → `₹1,234.50` (Indian grouping). */
export function inr(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const [int, frac = '00'] = abs.toFixed(2).split('.');
  const grouped = formatIndianGrouping(int ?? '0');
  const fracPadded = (frac + '00').slice(0, 2);
  return `${sign}₹${grouped}.${fracPadded}`;
}

/** `1500` → `1.5K`, `2_400_000` → `2.4M`. */
export function compactNumber(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs < 1_000) {
    return `${sign}${abs}`;
  }
  if (abs < 1_000_000) {
    return `${sign}${trim(abs / 1_000)}K`;
  }
  if (abs < 1_000_000_000) {
    return `${sign}${trim(abs / 1_000_000)}M`;
  }
  return `${sign}${trim(abs / 1_000_000_000)}B`;
}

/** Relative time: `just now`, `2h ago`, `3 days ago`. */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) {
    return 'just now';
  }
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return 'just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

/** `+919876543210` → `+91 ••••• ••210`. Strips non-digits, keeps country code. */
export function maskedPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) {
    return phone;
  }
  const country = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)} ` : '';
  const last3 = digits.slice(-3);
  return `${country}••••• ••${last3}`;
}

/** `74` seconds → `01:14`, `3760` → `1:02:40`. */
export function duration(totalSeconds: number): string {
  const s = Math.abs(Math.trunc(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h === 0 ? `${mm}:${ss}` : `${h}:${mm}:${ss}`;
}

function trim(value: number): string {
  const fixed = value.toFixed(1);
  return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

function formatIndianGrouping(digits: string): string {
  if (digits.length <= 3) {
    return digits;
  }
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  // Group remaining digits in twos from the right.
  const groups: string[] = [];
  let i = rest.length;
  while (i > 0) {
    const start = Math.max(0, i - 2);
    groups.unshift(rest.slice(start, i));
    i -= 2;
  }
  return `${groups.join(',')},${last3}`;
}
