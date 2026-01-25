import { apiRequest } from './api';

export interface PendingPayment {
  installmentValue: number;
  clientId: number;
  clientName: string;
  creditId: number;
  remainingInstallments: number;
  finalDate: string;
  hasOverdueInstallments: boolean;
  overdueInstallmentsCount: number;
  accumulatedOverdueValue: number;
}

export interface DailySchedule {
  pendingPayments: PendingPayment[];
  dailyExpectation: number;
  collectedToday: number;
  remainingToCollect: number;
}

export interface CreateDebitRequest {
  value: number;
  creditId: number;
  changeAllDays: boolean;
}

export interface Debit {
  id: number;
  value: number;
  creditId: number;
  clientName: string;
  createdAt: string;
  visible: boolean;
  changeAllDays: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Funções da API
export const getDailySchedule = async (): Promise<DailySchedule> => {
  try {
    const response = await apiRequest('/api/debits/build_daily_schedule', {
      method: 'GET',
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao buscar agenda diária:', error);
    throw error;
  }
};

export const createDebit = async (debit: CreateDebitRequest): Promise<ApiResponse<any>> => {
  try {
    const response = await apiRequest('/api/debits', {
      method: 'POST',
      body: JSON.stringify(debit),
    });

    return {
      success: true,
      message: response.message || 'Débito criado com sucesso',
      data: response.data
    };
  } catch (error: any) {
    console.error('Erro ao criar débito:', error);
    return {
      success: false,
      message: error.message || 'Erro ao criar débito',
      data: null
    };
  }
};

export const getDebits = async (): Promise<Debit[]> => {
  try {
    const response = await apiRequest('/api/debits', {
      method: 'GET',
    });

    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar débitos:', error);
    throw error;
  }
};

export const undoDebit = async (debitId: number): Promise<ApiResponse<Debit | null>> => {
  try {
    const response = await apiRequest(`/api/debits/${debitId}/undo`, {
      method: 'POST',
    });

    return {
      success: true,
      message: response.message || 'Débito desfeito com sucesso',
      data: response.data
    };
  } catch (error: any) {
    console.error('Erro ao desfazer débito:', error);
    return {
      success: false,
      message: error.message || 'Erro ao desfazer débito',
      data: null
    };
  }
};
