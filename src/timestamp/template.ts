import { Template } from '../../prisma/build';
import { calDailyReset, calEdenReset, calRecur, calTravelingSpirit } from './calculate';

const propPattern = /\$\(\s*(\w+)(?:,\s*([^,)]*))?(?:,\s*([^,)]*))?(?:,\s*([^,)]*))?\s*\)/g;

type DateToUnix<O extends Record<string, Date | number>> = {
  [K in keyof O]: number;
};

export interface MainData {
  daily_reset: DateToUnix<ReturnType<typeof calDailyReset>>;
  eden_reset: DateToUnix<ReturnType<typeof calEdenReset>>;
  traveling_spirit: DateToUnix<ReturnType<typeof calTravelingSpirit>>;
}

export function renderMain(data: MainData, { recordKey, template }: Template) {
  if (recordKey !== 'main') {
    throw new Error('Template must be for main');
  }

  const { daily_reset, eden_reset, traveling_spirit } = data;
  const { previous: prevDaily, next: nextDaily } = daily_reset;
  const { previous: prevEden, next: nextEden } = eden_reset;
  const { start: tsStart, end: tsEnd, count: tsCount } = traveling_spirit;

  //$(prop, format)

  const timestamps = {
    daily_reset_previous: prevDaily,
    daily_reset_next: nextDaily,
    eden_reset_previous: prevEden,
    eden_reset_next: nextEden,
    traveling_spirit_start: tsStart,
    traveling_spirit_end: tsEnd,
    traveling_spirit_count: tsCount,
  };

  return replacer(template, timestamps);
}

export type RecurData = {
  recordKey: string;
  occurrences: number[];
  next: number;
  ongoingUntil?: number;
  collectable: boolean;
};

export function renderRecur(data: RecurData, { recordKey, template }: Template) {
  if (!recordKey.startsWith('recur')) {
    throw new Error('Template must be for recur');
  }

  return replacer(template, data);
}

const discordFormat = 'tTdDfFR'.split('');

export function timeFormatter(dt: number | null, format: string) {
  if (!dt) return '';
  if (!format || format.length === 0 || format === '%') {
    return `<t:${dt}>`;
  } else if (format.length === 1) {
    if (discordFormat) {
      return `<t:${dt}:${format}>`;
    } else {
      throw new Error(`Unknown Format: ${format}`);
    }
  } else {
    return format.replace(/%([tTdDfFR ])/g, (_, f) => (f.trim() ? `<t:${dt}:${f}>` : `<t:${dt}>`));
  }
}

function replacer(template: string, data: Record<string, any>) {
  return template.replace(propPattern, (full, prop, format, a2, a3) => {
    if (data[prop] === undefined) {
      throw new Error(`Unknown property: ${prop}`);
    }

    const value = data[prop];

    if (value instanceof Array) {
      if (typeof value[0] === 'number') {
        return value.map(v => timeFormatter(v, format)).join(a2 ?? '➡️');
      }
    } else if (typeof value === 'number' || value === null) {
      return timeFormatter(value, format);
    }

    return '';
  });
}
