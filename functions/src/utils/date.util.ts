import dayjs from 'dayjs';
import { Timestamp } from 'firebase-admin/firestore';

export const MILLIS_PER_MINUTE = 60000;

// TODO use the actual timezone saved in the schema instead
const TIMEZONE_STR = 'Asia/Bangkok';

export const isoStringFromTimestamp = (timestamp: Timestamp): string =>
  timestamp.toDate().toISOString();

export const timestampFromIsoString = (isoString: string): Timestamp =>
  Timestamp.fromDate(new Date(isoString));

export const formatDateToMonthId = (date: Date): string => {
  return dayjs(date).tz(TIMEZONE_STR).format('YYYY-MM');
};

export const formatDateToString = (date: Date): string => {
  return dayjs(date).tz(TIMEZONE_STR).format('YYYY-MM-DD');
};

export const formatDateToTime = (date: Date): string => {
  return dayjs(date).tz(TIMEZONE_STR).format('HH:mm');
};
