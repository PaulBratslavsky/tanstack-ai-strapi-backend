/**
 * Strip nullish values from an object for clean JSON output
 */
export const stripNullish = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  for (const key in obj) {
    const value = obj[key];
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};

function pacificWallClock(instant: Date): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  let hour = Number(value('hour'));
  if (hour === 24) hour = 0;
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    minutes: hour * 60 + Number(value('minute')),
  };
}

/** UTC instant of midnight America/Los_Angeles on a YYYY-MM-DD calendar date. */
export function pacificMidnightIso(yyyyMmDd: string): string {
  const [year, month, day] = yyyyMmDd.split('-').map(Number);
  let utc = new Date(Date.UTC(year, month - 1, day, 8, 0, 0));

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const wall = pacificWallClock(utc);
    const dayDelta = wall.date < yyyyMmDd ? 1 : wall.date > yyyyMmDd ? -1 : 0;
    const deltaMinutes = dayDelta * 1440 - wall.minutes;
    if (deltaMinutes === 0) return utc.toISOString();
    utc = new Date(utc.getTime() + deltaMinutes * 60 * 1000);
  }

  return utc.toISOString();
}

/** A YYYY-MM-DD value is midnight Pacific. A full timestamp is used as given. */
export function sinceToIso(since: string): string {
  const trimmed = since.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return pacificMidnightIso(trimmed);
  return trimmed;
}
