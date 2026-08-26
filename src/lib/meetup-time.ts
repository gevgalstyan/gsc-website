/**
 * Canonical date and booking-window helpers for meetups.
 *
 * Responsibilities:
 * - Treats admin input as Europe/Moscow wall-clock time
 * - Converts wall-clock values to UTC instants for Supabase
 * - Converts stored instants back to admin input values
 * - Derives booking availability from real instants and capacity
 *
 * Risk: HIGH. A timezone conversion here affects every meetup and booking window.
 */

// ======================================================
// DATE / TIMEZONE HANDLING — EUROPE/MOSCOW
// ======================================================
export const MEETUP_TIME_ZONE = "Europe/Moscow";

export type MeetupBookingState = "open" | "full" | "not_open" | "closed";

type BookingWindow = {
  booking_opens_at: string | null;
  booking_closes_at: string | null;
  confirmed_booking_count: number;
  capacity: number;
};

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function partsInTimeZone(value: Date, timeZone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);

  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
    minute: part("minute"),
    second: part("second"),
  };
}

function offsetAt(instant: number, timeZone: string) {
  const parts = partsInTimeZone(new Date(instant), timeZone);
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - instant;
}

/** Converts a timezone-free admin wall time into its real UTC instant. */
export function meetupWallTimeToIso(value: string, timeZone = MEETUP_TIME_ZONE) {
  const match = localDateTimePattern.exec(value);
  if (!match) throw new RangeError("Invalid meetup date and time");

  const expected: DateTimeParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
  const wallTimeAsUtc = Date.UTC(
    expected.year,
    expected.month - 1,
    expected.day,
    expected.hour,
    expected.minute,
    expected.second,
  );

  let instant = wallTimeAsUtc - offsetAt(wallTimeAsUtc, timeZone);
  instant = wallTimeAsUtc - offsetAt(instant, timeZone);

  const actual = partsInTimeZone(new Date(instant), timeZone);
  if (Object.keys(expected).some((key) => expected[key as keyof DateTimeParts] !== actual[key as keyof DateTimeParts])) {
    throw new RangeError(`The meetup date and time does not exist in ${timeZone}`);
  }

  return new Date(instant).toISOString();
}

/** Converts a stored UTC instant into the Moscow wall time expected by datetime-local. */
export function instantToMeetupWallTime(value: string, timeZone = MEETUP_TIME_ZONE) {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) throw new RangeError("Invalid stored meetup timestamp");
  const parts = partsInTimeZone(instant, timeZone);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

// ======================================================
// MEETUP BOOKING — AVAILABILITY STATE
// ======================================================
export function getMeetupBookingState(meetup: BookingWindow, now = Date.now()): MeetupBookingState {
  if (meetup.booking_closes_at && now >= new Date(meetup.booking_closes_at).getTime()) return "closed";
  if (meetup.booking_opens_at && now < new Date(meetup.booking_opens_at).getTime()) return "not_open";
  if (meetup.confirmed_booking_count >= meetup.capacity) return "full";
  return "open";
}
