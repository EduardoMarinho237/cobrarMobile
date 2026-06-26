export const isSunday = (date: Date = new Date()): boolean => {
  return date.getDay() === 0;
};

export const isSundayBlocked = (): boolean => {
  const forceBlock = import.meta.env.VITE_SUNDAY_BLOCK === 'true';
  if (forceBlock) return true;
  const isDevMode = !!import.meta.env.VITE_DEV_MODE;
  return isSunday() && !isDevMode;
};

export const isSundayForced = (): boolean => {
  return import.meta.env.VITE_SUNDAY_BLOCK === 'true';
};

export const addBusinessDays = (start: Date, businessDays: number): Date => {
  const result = new Date(start);
  let added = 0;
  while (added < businessDays) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0) {
      added++;
    }
  }
  return result;
};

export const nextBusinessDay = (date: Date = new Date()): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0) {
    next.setDate(next.getDate() + 1);
  }
  return next;
};

export const businessDaysBetween = (startInc: Date, endInc: Date): number => {
  let count = 0;
  const current = new Date(startInc);
  while (current <= endInc) {
    if (current.getDay() !== 0) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

export const todayFormatted = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const nextBusinessDayFormatted = (): string => {
  const date = nextBusinessDay();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getAvailableStartDates = (): string[] => {
  const today = new Date();
  const dates: string[] = [];
  if (!isSunday(today)) {
    dates.push(todayFormatted());
  }
  const tomorrow = nextBusinessDay(today);
  dates.push(
    `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  );
  return dates;
};
