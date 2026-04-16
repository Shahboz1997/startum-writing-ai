/**
 * Calendar parts in an IANA timezone (for reminder scheduling).
 */

export function getZonedParts(date, timeZone) {
  let tz = timeZone || 'UTC';
  try {
    const d = new Date(date);
    const hourFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    });
    const parts = hourFmt.formatToParts(d);
    const map = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }
    const hour = parseInt(map.hour, 10);
    const minute = parseInt(map.minute, 10);
    const weekdayStr = map.weekday || 'Mon';
    const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const weekday = DOW[weekdayStr] ?? 1;
    return { hour, minute, weekday, weekdayStr };
  } catch {
    return getZonedParts(date, 'UTC');
  }
}

export function zonedDateKey(date, timeZone) {
  const tz = timeZone || 'UTC';
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  }
}
