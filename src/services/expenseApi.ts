import { apiRequest, isDev } from './api';

export interface ExpenseCategory {
  id: number;
  name: string;
  expenseTypesCount: number;
}

export interface ExpenseType {
  id: number;
  name: string;
  categoryId: number;
}

export interface ExpenseDetail {
  type: string;
  amount: number;
}

export const getExpenseCategories = async () => {
  if (isDev()) {
    // Mock response
    return [
      {
        id: 1,
        name: 'Fuel',
        expenseTypesCount: 3
      },
      {
        id: 2,
        name: 'Food',
        expenseTypesCount: 0
      },
      {
        id: 3,
        name: 'Maintenance',
        expenseTypesCount: 5
      }
    ];
  }

  return apiRequest('/api/expenses-categories');
};

export const createExpenseCategory = async (name: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Category created successfully'
    };
  }

  return apiRequest('/api/expenses-categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
};

export const updateExpenseCategory = async (id: number, name: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Category updated successfully'
    };
  }

  return apiRequest(`/api/expenses-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
};

export const deleteExpenseCategory = async (id: number, migrateTo?: number) => {
  if (isDev()) {
    return {
      success: true,
      message: migrateTo ? 'Category deleted and types migrated successfully' : 'Category deleted successfully'
    };
  }

  const body = migrateTo ? { migrateTo } : {};
  
  return apiRequest(`/api/expenses-categories/${id}`, {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
};

export const getExpenseTypes = async (categoryId: number) => {
  if (isDev()) {
    // Mock response
    return [
      {
        id: 1,
        name: 'Gasoline',
        categoryId: categoryId
      },
      {
        id: 2,
        name: 'Ethanol',
        categoryId: categoryId
      },
      {
        id: 3,
        name: 'Diesel',
        categoryId: categoryId
      }
    ];
  }

  return apiRequest(`/api/expenses-types/category/${categoryId}`);
};

export const createExpenseType = async (categoryId: number, name: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Expense type created successfully'
    };
  }

  return apiRequest(`/api/expenses-types`, {
    method: 'POST',
    body: JSON.stringify({ name, categoryId }),
  });
};

export const updateExpenseType = async (categoryId: number, typeId: number, name: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Expense type updated successfully'
    };
  }

  return apiRequest(`/api/expenses-types/${typeId}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
};

export const deleteExpenseType = async (categoryId: number, typeId: number) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Expense type deleted successfully'
    };
  }

  return apiRequest(`/api/expenses-types/${typeId}`, {
    method: 'DELETE',
  });
};

export const getExpenseDetails = async (categoryId: number, period: string) => {
  if (isDev()) {
    // Mock response
    return {
      total: 1500.50,
      details: [
        {
          type: 'Gasoline',
          amount: 800.00
        },
        {
          type: 'Ethanol',
          amount: 500.00
        },
        {
          type: 'Diesel',
          amount: 200.50
        }
      ]
    };
  }

  return apiRequest(`/api/expenses-details/category/${categoryId}?period=${period}`);
};

// Interfaces para Despesas (Expenses)
export interface Expense {
  id: number;
  value: number;
  expenseTypeId: number;
  expenseTypeName: string;
  description: string;
  createdAt: string;
  userId: number;
}

export interface CreateExpenseRequest {
  value: number;
  expenseTypeId: number;
  description?: string;
}

export interface UpdateExpenseRequest {
  value: number;
  expenseTypeId: number;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// Mock data para desenvolvimento
const mockExpenses: Expense[] = [
  {
    id: 1,
    value: 50,
    expenseTypeId: 1,
    expenseTypeName: 'Alimentação',
    description: 'Almoço no restaurante',
    createdAt: '2024-01-24T12:30:00',
    userId: 123
  },
  {
    id: 2,
    value: 30,
    expenseTypeId: 2,
    expenseTypeName: 'Transporte',
    description: 'Combustível',
    createdAt: '2024-01-24T08:15:00',
    userId: 123
  },
  {
    id: 3,
    value: 20,
    expenseTypeId: 1,
    expenseTypeName: 'Alimentação',
    description: 'Café da manhã',
    createdAt: '2024-01-24T07:00:00',
    userId: 123
  }
];

// Funções da API de Despesas
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const response = await apiRequest('/api/expenses', {
      method: 'GET',
    });

    // Se for modo mock, retorna dados mockados
    if (response.mock) {
      return mockExpenses;
    }

    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    return mockExpenses; // Fallback para mock
  }
};

export const getExpense = async (id: number): Promise<Expense | null> => {
  try {
    const response = await apiRequest(`/api/expenses/${id}`, {
      method: 'GET',
    });

    // Se for modo mock, busca nos dados mockados
    if (response.mock) {
      return mockExpenses.find(expense => expense.id === id) || null;
    }

    return response.data || null;
  } catch (error) {
    console.error('Erro ao buscar despesa:', error);
    return mockExpenses.find(expense => expense.id === id) || null; // Fallback para mock
  }
};

export const createExpense = async (expense: CreateExpenseRequest): Promise<ApiResponse<Expense>> => {
  try {
    const response = await apiRequest('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });

    // Se for modo mock, cria uma nova despesa mockada
    if (response.mock) {
      const newExpense: Expense = {
        id: Math.max(...mockExpenses.map(e => e.id)) + 1,
        value: expense.value,
        expenseTypeId: expense.expenseTypeId,
        expenseTypeName: `Tipo ${expense.expenseTypeId}`, // Em um app real, buscaria o nome
        description: expense.description || '',
        createdAt: new Date().toISOString(),
        userId: 123 // Em um app real, pegaria o ID do usuário logado
      };

      mockExpenses.push(newExpense);
      
      return {
        success: true,
        message: 'Despesa criada com sucesso',
        data: newExpense
      };
    }

    return {
      success: true,
      message: response.message || 'Despesa criada com sucesso',
      data: response.data!
    };
  } catch (error: any) {
    console.error('Erro ao criar despesa:', error);
    return {
      success: false,
      message: error.message || 'Erro ao criar despesa',
      data: null
    };
  }
};

export const updateExpense = async (id: number, expense: UpdateExpenseRequest): Promise<ApiResponse<Expense>> => {
  try {
    const response = await apiRequest(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });

    // Se for modo mock, atualiza a despesa mockada
    if (response.mock) {
      const expenseIndex = mockExpenses.findIndex(e => e.id === id);
      if (expenseIndex === -1) {
        return {
          success: false,
          message: 'Despesa não encontrada',
          data: null
        };
      }

      const existingExpense = mockExpenses[expenseIndex];
      const updatedExpense: Expense = {
        ...existingExpense,
        value: expense.value,
        expenseTypeId: expense.expenseTypeId,
        expenseTypeName: `Tipo ${expense.expenseTypeId}`, // Em um app real, buscaria o nome
        description: expense.description || ''
      };

      mockExpenses[expenseIndex] = updatedExpense;
      
      return {
        success: true,
        message: 'Despesa atualizada com sucesso',
        data: updatedExpense
      };
    }

    return {
      success: true,
      message: response.message || 'Despesa atualizada com sucesso',
      data: response.data!
    };
  } catch (error: any) {
    console.error('Erro ao atualizar despesa:', error);
    return {
      success: false,
      message: error.message || 'Erro ao atualizar despesa',
      data: null
    };
  }
};

export const deleteExpense = async (id: number): Promise<ApiResponse<null>> => {
  try {
    const response = await apiRequest(`/api/expenses/${id}`, {
      method: 'DELETE',
    });

    // Se for modo mock, remove a despesa mockada
    if (response.mock) {
      const expenseIndex = mockExpenses.findIndex(e => e.id === id);
      if (expenseIndex === -1) {
        return {
          success: false,
          message: 'Despesa não encontrada',
          data: null
        };
      }

      mockExpenses.splice(expenseIndex, 1);
      
      return {
        success: true,
        message: 'Despesa excluída com sucesso',
        data: null
      };
    }

    return {
      success: true,
      message: response.message || 'Despesa excluída com sucesso',
      data: null
    };
  } catch (error: any) {
    console.error('Erro ao excluir despesa:', error);
    return {
      success: false,
      message: error.message || 'Erro ao excluir despesa',
      data: null
    };
  }
};
