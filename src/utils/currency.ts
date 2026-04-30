/**
 * Utilitários para formatação de valores monetários
 */

/**
 * Formata um valor numérico para o formato de moeda sem símbolo de moeda
 * @param value - O valor numérico para formatar
 * @returns O valor formatado com prefixo "$"
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formata um valor numérico com prefixo "$"
 * @param value - O valor numérico para formatar
 * @returns O valor formatado com prefixo "$"
 */
export const formatCurrencyWithSymbol = (value: number): string => {
  return `$ ${formatCurrency(value)}`;
};
