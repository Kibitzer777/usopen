import { DateTime } from 'luxon';

// Eastern timezone helper
export const EASTERN_TIMEZONE = 'America/New_York';

// Get current date in Eastern timezone
export function getCurrentEasternDate(): string {
  return DateTime.now().setZone(EASTERN_TIMEZONE).toISODate() ?? '';
}

// Convert UTC timestamp to Eastern time
export function convertUtcToEastern(utcTimestamp: string): DateTime {
  return DateTime.fromISO(utcTimestamp, { zone: 'utc' }).setZone(EASTERN_TIMEZONE);
}

// Format time for display (e.g., "2:30 PM")
export function formatTimeForDisplay(dateTime: DateTime): string {
  return dateTime.toFormat('h:mm a');
}

// Format date for display (e.g., "Mon, Aug 26")
export function formatDateForDisplay(dateTime: DateTime): string {
  return dateTime.toFormat('ccc, MMM d');
}

// Get tournament date range (US Open 2025: Aug 25 - Sep 7)
export function getTournamentDates(): { start: DateTime; end: DateTime; dates: string[] } {
  const start = DateTime.fromISO('2025-08-25', { zone: EASTERN_TIMEZONE });
  const end = DateTime.fromISO('2025-09-07', { zone: EASTERN_TIMEZONE });
  
  const dates: string[] = [];
  let current = start;
  
  while (current <= end) {
    dates.push(current.toISODate() ?? '');
    current = current.plus({ days: 1 });
  }
  
  return { start, end, dates };
}

// Check if date is today or future
export function isTodayOrFuture(dateString: string): boolean {
  const date = DateTime.fromISO(dateString, { zone: EASTERN_TIMEZONE });
  const today = DateTime.now().setZone(EASTERN_TIMEZONE).startOf('day');
  return date >= today;
}

