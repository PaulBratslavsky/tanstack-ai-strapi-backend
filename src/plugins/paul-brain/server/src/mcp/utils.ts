/**
 * Recursively remove null and undefined values from an object or array.
 * This ensures MCP output validation passes even when Strapi returns null for unset fields.
 * 
 * @param obj - The object/array to clean
 * @returns A new object/array with null/undefined values removed
 */
export function stripNullish<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== null && item !== undefined)
      .map(item => stripNullish(item)) as T;
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        cleaned[key] = stripNullish(value);
      }
    }
    return cleaned as T;
  }

  return obj;
}

/**
 * Get today's date in YYYY-MM-DD format for America/Los_Angeles timezone.
 * This ensures consistent date handling for goals, todos, and check-ins
 * even when the server is running in UTC.
 * 
 * @returns Today's date as YYYY-MM-DD string in America/Los_Angeles timezone
 */
export function getTodayPST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Get a date N days ago in YYYY-MM-DD format, relative to America/Los_Angeles timezone.
 * Uses UTC-midnight arithmetic so DST transitions never shift calendar dates.
 * 
 * @param days - Number of days to subtract from today
 * @returns Date as YYYY-MM-DD string
 */
export function getDaysAgoPST(days: number): string {
  const d = new Date(getTodayPST() + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Calculate the number of days between two YYYY-MM-DD date strings.
 * Uses UTC midnight for both dates to avoid DST issues.
 * 
 * @param laterDateStr - Later date in YYYY-MM-DD format
 * @param earlierDateStr - Earlier date in YYYY-MM-DD format
 * @returns Number of days between the dates (positive if later > earlier)
 */
export function diffDays(laterDateStr: string, earlierDateStr: string): number {
  const later = new Date(laterDateStr + 'T00:00:00Z');
  const earlier = new Date(earlierDateStr + 'T00:00:00Z');
  return Math.round((later.getTime() - earlier.getTime()) / 86400000);
}
