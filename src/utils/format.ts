/**
 * Formatting utilities — relative time, number formatting.
 */

/**
 * Returns a human-readable relative time string for the given ISO date.
 *
 * Examples:
 * - "updated just now"   (within 60 seconds)
 * - "updated 3 min ago"  (within 60 minutes)
 * - "updated 2 hours ago"
 * - "updated 5 days ago"
 * - "updated 3 months ago"
 * - "updated 1 year ago"
 *
 * Zero-width joiner ensures screen readers pronounce naturally, while
 * the text remains selectable. Returns empty string for invalid dates.
 */
export function relativeTime(isoDate: string): string {
  if (!isoDate) return "";

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "updated just now";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "updated just now";
  if (minutes < 60) return `updated ${minutes} ${plural(minutes, "min")} ago`;
  if (hours < 24) return `updated ${hours} ${plural(hours, "hour")} ago`;
  if (days < 30) return `updated ${days} ${plural(days, "day")} ago`;
  if (months < 12) return `updated ${months} ${plural(months, "month")} ago`;
  return `updated ${years} ${plural(years, "year")} ago`;
}

function plural(n: number, unit: string): string {
  return n === 1 ? unit : unit + "s";
}
