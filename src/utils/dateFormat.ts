const TIMEZONE = 'America/Sao_Paulo';

export const formatDateToLocalISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatToBrazilTime = (dateString: string): string => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
};

export const formatToBrazilDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
};

export const getCurrentBrazilDate = (): Date => {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: TIMEZONE })
  );
};

export const getCurrentBrazilTimeString = (): string => {
  return new Date().toLocaleString('pt-BR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
