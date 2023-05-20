import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import dayjs from 'dayjs';

dayjs.extend(timezone);
dayjs.extend(utc);

const tz = 'Europe/Minsk';
const localDateFormat = 'YYYY-MM-DD';

export const dateToLocalDateString = (date?: Date) => {
  return dayjs(date).tz(tz).format(localDateFormat);
};
