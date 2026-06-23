import { apiRequest } from './api';

export interface CashTransaction {
  id: number;
  routeId: number;
  createdBy: number;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId: number | null;
  referenceType: string | null;
  description: string | null;
  createdAt: string;
}

export interface CashBalanceResponse {
  success: boolean;
  message: string;
  data: number;
}

export interface DepositRequest {
  routeId: number;
  amount: number;
  description?: string;
}

export interface WithdrawalRequest {
  routeId: number;
  amount: number;
  description?: string;
}

export const deposit = async (request: DepositRequest): Promise<{ success: boolean; message: string; data?: any }> => {
  return apiRequest('/api/cash-box/deposit', {
    method: 'POST',
    body: JSON.stringify(request)
  });
};

export const withdrawal = async (request: WithdrawalRequest): Promise<{ success: boolean; message: string; data?: any }> => {
  return apiRequest('/api/cash-box/withdrawal', {
    method: 'POST',
    body: JSON.stringify(request)
  });
};

export const getMyBalance = async (): Promise<number> => {
  try {
    const response: CashBalanceResponse = await apiRequest('/api/cash-box/my-balance');
    return response?.data || 0;
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    return 0;
  }
};

export const getMyInitialBalance = async (): Promise<number> => {
  try {
    const response: CashBalanceResponse = await apiRequest('/api/cash-box/my-initial-balance');
    return response?.data || 0;
  } catch (error) {
    console.error('Erro ao buscar saldo inicial:', error);
    return 0;
  }
};

export const getBalance = async (routeId: number): Promise<number> => {
  try {
    const response: CashBalanceResponse = await apiRequest(`/api/cash-box/balance/${routeId}`);
    return response?.data || 0;
  } catch (error) {
    console.error('Erro ao buscar saldo:', error);
    return 0;
  }
};

export const getMyTransactions = async (): Promise<CashTransaction[]> => {
  try {
    const response = await apiRequest('/api/cash-box/my-transactions');
    return response?.data || [];
  } catch (error) {
    console.error('Erro ao buscar transacoes:', error);
    return [];
  }
};

export const getTransactions = async (routeId: number): Promise<CashTransaction[]> => {
  try {
    const response = await apiRequest(`/api/cash-box/transactions/${routeId}`);
    return response?.data || [];
  } catch (error) {
    console.error('Erro ao buscar transacoes:', error);
    return [];
  }
};

export const getMyManagerTransactions = async (): Promise<CashTransaction[]> => {
  try {
    const response = await apiRequest('/api/cash-box/my-manager-transactions');
    return response?.data || [];
  } catch (error) {
    console.error('Erro ao buscar transacoes do manager:', error);
    return [];
  }
};
