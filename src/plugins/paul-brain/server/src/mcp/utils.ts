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
