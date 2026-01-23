import { apiRequest, isDev } from './api';

export interface CategoriaGasto {
  id: number;
  name: string;
  expensesTypesCount: number;
}

export interface TipoGasto {
  id: number;
  name: string;
  expenseCategoryId: number;
}

export interface GastoDetalhe {
  typeId: number;
  typeName: string;
  amount: number;
}

export interface CategoriaDetalhesResponse {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  expenseTypes: GastoDetalhe[];
}

export interface DetalhesRequest {
  timePeriod?: 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_60_DAYS' | 'LAST_90_DAYS' | 'ALL_TIME';
  dateFrom?: string;
  dateTo?: string;
}

export const getCategorias = async () => {
  if (isDev()) {
    // Mock response
    return [
      {
        id: 1,
        name: 'Combustível',
        expensesTypesCount: 3
      },
      {
        id: 2,
        name: 'Alimentação',
        expensesTypesCount: 0
      },
      {
        id: 3,
        name: 'Manutenção',
        expensesTypesCount: 5
      }
    ];
  }

  return apiRequest('/api/expenses-categories');
};

export const createCategoria = async (nome: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Categoria criada com sucesso'
    };
  }

  return apiRequest('/api/expenses-categories', {
    method: 'POST',
    body: JSON.stringify({ name: nome }),
  });
};

export const updateCategoria = async (id: number, nome: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Categoria atualizada com sucesso'
    };
  }

  return apiRequest(`/api/expenses-categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: nome }),
  });
};

export const deleteCategoria = async (id: number, migrarPara?: number) => {
  if (isDev()) {
    return {
      success: true,
      message: migrarPara ? 'Categoria excluída e tipos migrados com sucesso' : 'Categoria excluída com sucesso'
    };
  }

  const body = migrarPara ? { migrarPara } : {};
  
  return apiRequest(`/api/expenses-categories/${id}`, {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
};

export const getTiposGastos = async (categoriaId?: number) => {
  if (isDev()) {
    // Mock response
    return [
      {
        id: 1,
        name: 'Gasolina',
        expenseCategoryId: categoriaId || 1
      },
      {
        id: 2,
        name: 'Etanol',
        expenseCategoryId: categoriaId || 1
      },
      {
        id: 3,
        name: 'Diesel',
        expenseCategoryId: categoriaId || 1
      }
    ];
  }

  const url = categoriaId 
    ? `/api/expenses-types/category/${categoriaId}`
    : '/api/expenses-types';
  
  return apiRequest(url);
};

export const createTipoGasto = async (nome: string, categoriaId?: number) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Tipo de gasto criado com sucesso'
    };
  }

  const body = categoriaId ? { name: nome, expenseCategoryId: categoriaId } : { name: nome };
  
  return apiRequest('/api/expenses-types', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const updateTipoGasto = async (id: number, nome: string, categoriaId?: number) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Tipo de gasto atualizado com sucesso'
    };
  }

  const body = categoriaId ? { name: nome, expenseCategoryId: categoriaId } : { name: nome };
  
  return apiRequest(`/api/expenses-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

export const deleteTipoGasto = async (id: number) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Tipo de gasto excluído com sucesso'
    };
  }

  return apiRequest(`/api/expenses-types/${id}`, {
    method: 'DELETE',
  });
};

export const getDetalhesGastos = async (categoriaId: number, request: DetalhesRequest) => {
  console.log('getDetalhesGastos chamado com:', { categoriaId, request });
  
  if (isDev()) {
    // Mock response
    console.log('Usando mock response');
    return {
      categoryId: categoriaId,
      categoryName: 'Combustível',
      totalAmount: 1500.50,
      expenseTypes: [
        {
          typeId: 1,
          typeName: 'Gasolina',
          amount: 800.00
        },
        {
          typeId: 2,
          typeName: 'Etanol',
          amount: 500.00
        },
        {
          typeId: 3,
          typeName: 'Diesel',
          amount: 200.50
        }
      ]
    };
  }

  console.log('Fazendo requisição real para:', `/api/expenses-categories/details/${categoriaId}`);
  return apiRequest(`/api/expenses-categories/details/${categoriaId}`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};
