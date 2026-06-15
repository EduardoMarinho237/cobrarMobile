/**
 * Utility for formatting dates to Brazil timezone (America/Sao_Paulo)
 * All dates should be displayed in Brasilia time (UTC-3)
 */

export const TIMEZONE = 'America/Sao_Paulo';

/**
 * Format a date string to Brazil time (pt-BR format)
 * @param dateString - ISO date string from backend
 * @returns Formatted string in Brazil timezone
 */
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

/**
 * Format a date to Brazil date only (dd/MM/yyyy)
 */
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

/**
 * Get current date in Brazil timezone
 */
export const getCurrentBrazilDate = (): Date => {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: TIMEZONE })
  );
};

/**
 * Format the current time to Brazil timezone string
 */
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
