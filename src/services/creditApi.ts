import { apiRequest } from './api';

// Interfaces
export interface Credit {
  id: number;
  initialValue: number;
  startDate: string;
  tax: number;
  totalDebt: number;
  quantityDays: number;
  finalDate: string;
  dayValue: number;
  lastInstallment: number;
  clientId: number;
  clientName: string;
  visible: boolean;
  overdue: 'CAPITALIZE_DEBT' | 'EXTEND_TERM';
}

export interface CreateCreditRequest {
  initialValue: number;
  startDate: string;
  quantityDays: number;
  clientId: number;
  overdue?: 'CAPITALIZE_DEBT' | 'EXTEND_TERM';
}

export interface UpdateCreditRequest {
  initialValue: number;
  startDate: string;
  quantityDays: number;
  clientId: number;
  overdue?: 'CAPITALIZE_DEBT' | 'EXTEND_TERM';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// Mock data para desenvolvimento
const mockCredits: Credit[] = [
  {
    id: 1,
    initialValue: 1000,
    startDate: '2024-01-24',
    tax: 10,
    totalDebt: 1100,
    quantityDays: 30,
    finalDate: '2024-02-23',
    dayValue: 37,
    lastInstallment: 30,
    clientId: 1,
    clientName: 'João Silva',
    visible: true,
    overdue: 'CAPITALIZE_DEBT'
  },
  {
    id: 2,
    initialValue: 500,
    startDate: '2024-01-20',
    tax: 5,
    totalDebt: 525,
    quantityDays: 15,
    finalDate: '2024-02-04',
    dayValue: 35,
    lastInstallment: 15,
    clientId: 2,
    clientName: 'Maria Santos',
    visible: true,
    overdue: 'EXTEND_TERM'
  },
  {
    id: 3,
    initialValue: 2000,
    startDate: '2024-01-15',
    tax: 8,
    totalDebt: 2160,
    quantityDays: 45,
    finalDate: '2024-02-29',
    dayValue: 48,
    lastInstallment: 45,
    clientId: 1,
    clientName: 'João Silva',
    visible: true,
    overdue: 'CAPITALIZE_DEBT'
  }
];

// Funções da API
export const getCredits = async (): Promise<Credit[]> => {
  try {
    const response = await apiRequest('/api/credits', {
      method: 'GET',
    });

    // Se for modo mock, retorna dados mockados
    if (response.mock) {
      return mockCredits;
    }

    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar créditos:', error);
    return mockCredits; // Fallback para mock
  }
};

export const getCredit = async (id: number): Promise<Credit | null> => {
  try {
    const response = await apiRequest(`/api/credits/${id}`, {
      method: 'GET',
    });

    // Se for modo mock, busca nos dados mockados
    if (response.mock) {
      return mockCredits.find(credit => credit.id === id) || null;
    }

    return response.data || null;
  } catch (error) {
    console.error('Erro ao buscar crédito:', error);
    return mockCredits.find(credit => credit.id === id) || null; // Fallback para mock
  }
};

export const getCreditsByClient = async (clientId: number): Promise<Credit[]> => {
  try {
    const response = await apiRequest(`/api/credits/client/${clientId}`, {
      method: 'GET',
    });

    // Se for modo mock, filtra dos dados mockados
    if (response.mock) {
      return mockCredits.filter(credit => credit.clientId === clientId);
    }

    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar créditos do cliente:', error);
    return mockCredits.filter(credit => credit.clientId === clientId); // Fallback para mock
  }
};

export const createCredit = async (credit: CreateCreditRequest): Promise<ApiResponse<Credit>> => {
  try {
    const response = await apiRequest('/api/credits', {
      method: 'POST',
      body: JSON.stringify({
        ...credit,
        overdue: credit.overdue || 'EXTEND_TERM'
      }),
    });

    // Se for modo mock, cria um novo crédito mockado
    if (response.mock) {
      // Obter taxa do usuário logado (route)
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const tax = user?.tax || 0; // Taxa padrão 0 se não encontrada
      
      const newCredit: Credit = {
        id: Math.max(...mockCredits.map(c => c.id)) + 1,
        initialValue: credit.initialValue,
        startDate: credit.startDate,
        tax: tax,
        totalDebt: credit.initialValue + (credit.initialValue * tax / 100),
        quantityDays: credit.quantityDays,
        finalDate: new Date(new Date(credit.startDate).getTime() + credit.quantityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayValue: Math.round((credit.initialValue + (credit.initialValue * tax / 100)) / credit.quantityDays),
        lastInstallment: credit.quantityDays,
        clientId: credit.clientId,
        clientName: `Cliente ${credit.clientId}`, // Em um app real, buscaria o nome do cliente
        visible: true,
        overdue: 'EXTEND_TERM' // Valor padrão da aplicação
      };

      mockCredits.push(newCredit);
      
      return {
        success: true,
        message: 'Crédito criado com sucesso',
        data: newCredit
      };
    }

    return {
      success: true,
      message: response.message || 'Crédito criado com sucesso',
      data: response.data!
    };
  } catch (error: any) {
    console.error('Erro ao criar crédito:', error);
    return {
      success: false,
      message: error.message || 'Erro ao criar crédito',
      data: null
    };
  }
};

export const updateCredit = async (id: number, credit: UpdateCreditRequest): Promise<ApiResponse<Credit>> => {
  try {
    const response = await apiRequest(`/api/credits/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...credit,
        overdue: credit.overdue || 'EXTEND_TERM'
      }),
    });

    // Se for modo mock, atualiza o crédito mockado
    if (response.mock) {
      const creditIndex = mockCredits.findIndex(c => c.id === id);
      if (creditIndex === -1) {
        return {
          success: false,
          message: 'Crédito não encontrado',
          data: null
        };
      }

      const existingCredit = mockCredits[creditIndex];
      // Obter taxa do usuário logado (route)
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const tax = user?.tax || 0; // Taxa padrão 0 se não encontrada
      
      const updatedCredit: Credit = {
        ...existingCredit,
        initialValue: credit.initialValue,
        startDate: credit.startDate,
        tax: tax,
        totalDebt: credit.initialValue + (credit.initialValue * tax / 100),
        quantityDays: credit.quantityDays,
        finalDate: new Date(new Date(credit.startDate).getTime() + credit.quantityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dayValue: Math.round((credit.initialValue + (credit.initialValue * tax / 100)) / credit.quantityDays),
        lastInstallment: credit.quantityDays,
        clientId: credit.clientId,
        clientName: `Cliente ${credit.clientId}` // Em um app real, buscaria o nome do cliente
      };

      mockCredits[creditIndex] = updatedCredit;
      
      return {
        success: true,
        message: 'Crédito atualizado com sucesso',
        data: updatedCredit
      };
    }

    return {
      success: true,
      message: response.message || 'Crédito atualizado com sucesso',
      data: response.data!
    };
  } catch (error: any) {
    console.error('Erro ao atualizar crédito:', error);
    return {
      success: false,
      message: error.message || 'Erro ao atualizar crédito',
      data: null
    };
  }
};

export const deleteCredit = async (id: number): Promise<ApiResponse<null>> => {
  try {
    const response = await apiRequest(`/api/credits/${id}`, {
      method: 'DELETE',
    });

    // Se for modo mock, remove o crédito mockado
    if (response.mock) {
      const creditIndex = mockCredits.findIndex(c => c.id === id);
      if (creditIndex === -1) {
        return {
          success: false,
          message: 'Crédito não encontrado',
          data: null
        };
      }

      mockCredits.splice(creditIndex, 1);
      
      return {
        success: true,
        message: 'Crédito excluído com sucesso',
        data: null
      };
    }

    return {
      success: true,
      message: response.message || 'Crédito excluído com sucesso',
      data: null
    };
  } catch (error: any) {
    console.error('Erro ao excluir crédito:', error);
    return {
      success: false,
      message: error.message || 'Erro ao excluir crédito',
      data: null
    };
  }
};
