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

  return apiRequest('/api/expense-categories');
};

export const createExpenseCategory = async (name: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Category created successfully'
    };
  }

  return apiRequest('/api/expense-categories', {
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

  return apiRequest(`/api/expense-categories/${id}`, {
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
  
  return apiRequest(`/api/expense-categories/${id}`, {
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

  return apiRequest(`/api/expense-categories/${categoryId}/types`);
};

export const createExpenseType = async (categoryId: number, name: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Expense type created successfully'
    };
  }

  return apiRequest(`/api/expense-categories/${categoryId}/types`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
};

export const updateExpenseType = async (categoryId: number, typeId: number, name: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Expense type updated successfully'
    };
  }

  return apiRequest(`/api/expense-categories/${categoryId}/types/${typeId}`, {
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

  return apiRequest(`/api/expense-categories/${categoryId}/types/${typeId}`, {
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

  return apiRequest(`/api/expense-categories/${categoryId}/details?period=${period}`);
};
