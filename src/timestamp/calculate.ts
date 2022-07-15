import {
  addDays,
  addMinutes,
  addWeeks,
  differenceInDays,
  differenceInWeeks,
  isAfter,
  isBefore,
  isSameDay,
  nextMonday,
  nextSunday,
  previousSunday,
  startOfDay,
  subDays,
} from 'date-fns';
import tz from 'date-fns-tz';
import { Record, RecordType } from '../../prisma/build';
const { zonedTimeToUtc, utcToZonedTime } = tz;

export const skyToUtc = (skyTime: Date): Date => {
  return zonedTimeToUtc(skyTime, 'America/Los_Angeles');
};

export const UtcToSky = (utcTime: Date): Date => {
  return utcToZonedTime(utcTime, 'America/Los_Angeles');
};

//Application Timezone is America/Los_Angeles

export function calDailyReset(date: Date) {
  const previous = startOfDay(date);
  return {
    previous,
    next: addDays(previous, 1),
  };
}

export function calEdenReset(date: Date) {
  date = startOfDay(date);
  return {
    previous: previousSunday(date),
    next: nextSunday(date),
  };
}

const tsPivotDate = new Date(2022, 0, 10);
const tsPivotCount = 52;

export function calTravelingSpirit(date: Date) {
  date = startOfDay(date);
  const nextMon = nextMonday(date);
  const end = differenceInWeeks(nextMon, tsPivotDate) % 2 ? addWeeks(nextMon, 1) : nextMon;
  const start = subDays(end, 4);
  const count = Math.floor(differenceInWeeks(nextMon, tsPivotDate) / 2) + tsPivotCount;

  return {
    start,
    end,
    count,
  };
}

// Cal Records

export function calRecord(date: Date, record: Record) {
  if (record.type === RecordType.Recur) {
    return calRecur(date, record);
  } else if (record.type === RecordType.Event) {
    return calEvent(date, record);
  }
}

export interface RecurData {
  interval: number;
  offset: number;
  duration: number;
  aOffset: number;
}

export function calRecur(date: Date, record: Record) {
  const dayStart = startOfDay(date);
  const { type, interval, offset, duration, collectibleAfter } = record;
  if (interval === null || offset === null || duration === null) {
    throw new Error('Invalid recur record');
  }
  const start = addMinutes(dayStart, offset);
  const count = Math.floor((24 * 60) / interval) + 1;
  const occurrences = Array.from({ length: count }, (_, i) => addMinutes(start, i * interval));
  const nextIndex = occurrences.findIndex(o => isAfter(o, date));
  const next = nextIndex === -1 ? null : occurrences[nextIndex];
  const previous = nextIndex < 1 ? null : occurrences[nextIndex - 1];
  const prevNotEnded = previous && isBefore(date, addMinutes(previous, duration));
  const prevColAvail = !collectibleAfter || (prevNotEnded && isAfter(date, addMinutes(previous, collectibleAfter)));
  const ongoingUntil = (prevNotEnded && addMinutes(previous, duration)) || null;

  return {
    type,
    occurrences: occurrences.filter(o => isSameDay(o, date)),
    next,
    ongoingUntil,
    collectable: prevColAvail && prevNotEnded,
  };
}

export interface EventData {
  start: number;
  end: number;
}

export function calEvent(date: Date, record: Record) {
  const { type, start, end } = record;
  if (start === null || end === null) {
    throw new Error('Invalid event record');
  }
  date = startOfDay(date);
  const startingIn = differenceInDays(start, date);
  const endingIn = differenceInDays(end, date);
  const isSeason = record.key.endsWith('season');

  //Event Spells, Season Quest

  return {
    type,
    start,
    end,
    startingIn,
    endingIn,
    isSeason,
  };
}
