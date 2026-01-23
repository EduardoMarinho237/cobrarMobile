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

  // Para endpoints GET, retorna a resposta diretamente
  return apiRequest('/api/expenses-categories');
};

export const createCategoria = async (nome: string) => {
  if (isDev()) {
    // Mock response
    return {
      success: true,
      message: 'Categoria criada com sucesso'
    };
  }

  try {
    const response = await apiRequest('/api/expenses-categories', {
      method: 'POST',
      body: JSON.stringify({ name: nome }),
    });
    
    // Se a resposta for null (vazia), considera sucesso
    if (response === null) {
      return {
        success: true,
        message: 'Categoria criada com sucesso'
      };
    }
    
    // Se a resposta já tiver success e message, retorna como está
    if (response && typeof response === 'object' && 'success' in response && 'message' in response) {
      return response;
    }
    
    // Senão, formata resposta de sucesso
    return {
      success: true,
      message: 'Categoria criada com sucesso',
      data: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão, tente novamente'
    };
  }
};

export const updateCategoria = async (id: number, nome: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Categoria atualizada com sucesso'
    };
  }

  try {
    const response = await apiRequest(`/api/expenses-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: nome }),
    });
    
    // Se a resposta for null (vazia), considera sucesso
    if (response === null) {
      return {
        success: true,
        message: 'Categoria atualizada com sucesso'
      };
    }
    
    // Se a resposta já tiver success e message, retorna como está
    if (response && typeof response === 'object' && 'success' in response && 'message' in response) {
      return response;
    }
    
    // Senão, formata resposta de sucesso
    return {
      success: true,
      message: 'Categoria atualizada com sucesso',
      data: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão, tente novamente'
    };
  }
};

export const migrateTiposGastos = async (sourceCategoryId: number, targetCategoryId: number) => {
  console.log('migrateTiposGastos chamada com:', { sourceCategoryId, targetCategoryId });
  
  if (isDev()) {
    console.log('Usando mock response para migrateTiposGastos');
    return {
      success: true,
      message: 'Tipos de gastos migrados com sucesso'
    };
  }

  try {
    console.log('Fazendo requisição de migração');
    const response = await apiRequest(`/api/expenses-categories/${sourceCategoryId}/migrate-expense-types`, {
      method: 'POST',
      body: JSON.stringify({ targetCategoryId }),
    });
    
    console.log('Resposta da migração (bruta):', response);
    
    // Se a resposta for nula (vazia), considera sucesso
    if (response === null) {
      console.log('Resposta vazia, considerando sucesso');
      return {
        success: true,
        message: 'Tipos de gastos migrados com sucesso'
      };
    }
    
    // Se a resposta for 200 OK ou similar, considera sucesso
    if (response && (response.status === 200 || response.ok || response.success !== false)) {
      console.log('Migração considerada sucesso');
      return {
        success: true,
        message: 'Tipos de gastos migrados com sucesso',
        data: response
      };
    }
    
    // Se tiver erro explícito na resposta
    if (response && response.success === false) {
      console.log('Erro explicito na resposta:', response.message);
      return {
        success: false,
        message: response.message || 'Erro ao migrar tipos de gastos'
      };
    }
    
    // Resposta inesperada mas não deu erro HTTP
    console.log('Resposta inesperada, considerando sucesso');
    return {
      success: true,
      message: 'Tipos de gastos migrados com sucesso',
      data: response
    };
    
  } catch (error) {
    console.error('Erro ao migrar tipos de gastos:', error);
    return {
      success: false,
      message: 'Erro ao migrar tipos de gastos'
    };
  }
};

export const deleteCategoria = async (id: number, migrarPara?: number) => {
  console.log('deleteCategoria chamada com:', { id, migrarPara });
  
  if (isDev()) {
    console.log('Usando mock response para deleteCategoria');
    return {
      success: true,
      message: migrarPara ? 'Categoria excluída e tipos migrados com sucesso' : 'Categoria excluída com sucesso'
    };
  }

  // Se houver categoria para migrar, primeiro faz a migração
  if (migrarPara) {
    console.log('Fazendo migração de tipos para categoria:', migrarPara);
    const migrateResult = await migrateTiposGastos(id, migrarPara);
    console.log('Resultado da migração:', migrateResult);
    
    if (!migrateResult.success) {
      console.log('Migração falhou, retornando erro');
      return migrateResult;
    }
  }

  // Depois exclui a categoria
  try {
    console.log('Fazendo requisição DELETE para categoria:', id);
    await apiRequest(`/api/expenses-categories/${id}`, {
      method: 'DELETE',
    });
    
    console.log('Categoria excluída com sucesso');
    return {
      success: true,
      message: migrarPara ? 'Categoria excluída e tipos migrados com sucesso' : 'Categoria excluída com sucesso'
    };
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return {
      success: false,
      message: 'Erro ao excluir categoria'
    };
  }
};

export const getTiposGastos = async (categoriaId?: number) => {
  if (isDev()) {
    // Mock response - retorna todos os tipos, incluindo os sem gastos
    const todosTipos = [
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
      },
      {
        id: 4,
        name: 'GNV',
        expenseCategoryId: categoriaId || 1
      },
      {
        id: 5,
        name: 'Almoço',
        expenseCategoryId: 2
      },
      {
        id: 6,
        name: 'Janta',
        expenseCategoryId: 2
      },
      {
        id: 7,
        name: 'Óleo',
        expenseCategoryId: 3
      },
      {
        id: 8,
        name: 'Filtro',
        expenseCategoryId: 3
      },
      {
        id: 9,
        name: 'Pneu',
        expenseCategoryId: 3
      },
      {
        id: 10,
        name: 'Pastilha',
        expenseCategoryId: 3
      }
    ];
    
    if (categoriaId) {
      return todosTipos.filter(tipo => tipo.expenseCategoryId === categoriaId);
    }
    
    return todosTipos;
  }

  // Para endpoints GET, retorna a resposta diretamente
  const endpoint = categoriaId ? `/api/expenses-types?expenseCategoryId=${categoriaId}` : '/api/expenses-types';
  return apiRequest(endpoint);
};

export const createTipoGasto = async (nome: string, categoriaId?: number) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Tipo de gasto criado com sucesso'
    };
  }

  try {
    const body = categoriaId ? { name: nome, expenseCategoryId: categoriaId } : { name: nome };
    const response = await apiRequest('/api/expenses-types', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    // Se a resposta for null (vazia), considera sucesso
    if (response === null) {
      return {
        success: true,
        message: 'Tipo de gasto criado com sucesso'
      };
    }
    
    // Se a resposta já tiver success e message, retorna como está
    if (response && typeof response === 'object' && 'success' in response && 'message' in response) {
      return response;
    }
    
    // Senão, formata resposta de sucesso
    return {
      success: true,
      message: 'Tipo de gasto criado com sucesso',
      data: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão, tente novamente'
    };
  }
};

export const updateTipoGasto = async (id: number, nome: string, categoriaId?: number) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Tipo de gasto atualizado com sucesso'
    };
  }

  try {
    const body = categoriaId ? { name: nome, expenseCategoryId: categoriaId } : { name: nome };
    const response = await apiRequest(`/api/expenses-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    
    // Se a resposta for null (vazia), considera sucesso
    if (response === null) {
      return {
        success: true,
        message: 'Tipo de gasto atualizado com sucesso'
      };
    }
    
    // Se a resposta já tiver success e message, retorna como está
    if (response && typeof response === 'object' && 'success' in response && 'message' in response) {
      return response;
    }
    
    // Senão, formata resposta de sucesso
    return {
      success: true,
      message: 'Tipo de gasto atualizado com sucesso',
      data: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão, tente novamente'
    };
  }
};

export const deleteTipoGasto = async (id: number, migrarPara?: number) => {
  console.log('deleteTipoGasto chamada com:', { id, migrarPara });
  
  if (isDev()) {
    console.log('Usando mock response para deleteTipoGasto');
    return {
      success: true,
      message: migrarPara ? 'Tipo de gasto excluído e gastos migrados com sucesso' : 'Tipo de gasto excluído com sucesso'
    };
  }

  // Se houver tipo para migrar, primeiro faz a migração dos gastos
  if (migrarPara) {
    console.log('Fazendo migração de gastos para tipo:', migrarPara);
    const migrateResult = await migrateGastos(id, migrarPara);
    console.log('Resultado da migração de gastos:', migrateResult);
    
    if (!migrateResult.success) {
      console.log('Migração de gastos falhou, retornando erro');
      return migrateResult;
    }
  }

  // Depois exclui o tipo de gasto
  try {
    console.log('Fazendo requisição DELETE para tipo de gasto:', id);
    await apiRequest(`/api/expenses-types/${id}`, {
      method: 'DELETE',
    });
    
    console.log('Tipo de gasto excluído com sucesso');
    return {
      success: true,
      message: migrarPara ? 'Tipo de gasto excluído e gastos migrados com sucesso' : 'Tipo de gasto excluído com sucesso'
    };
  } catch (error) {
    console.error('Erro ao excluir tipo de gasto:', error);
    return {
      success: false,
      message: 'Erro ao excluir tipo de gasto'
    };
  }
};

export const migrateGastos = async (sourceExpenseTypeId: number, targetExpenseTypeId: number) => {
  console.log('migrateGastos chamada com:', { sourceExpenseTypeId, targetExpenseTypeId });
  
  if (isDev()) {
    console.log('Usando mock response para migrateGastos');
    return {
      success: true,
      message: 'Gastos migrados com sucesso'
    };
  }

  try {
    console.log('Fazendo requisição de migração de gastos');
    const response = await apiRequest(`/api/expenses/${sourceExpenseTypeId}/migrate-expenses`, {
      method: 'POST',
      body: JSON.stringify({ targetExpenseTypeId }),
    });
    
    console.log('Resposta da migração de gastos (bruta):', response);
    
    // Se a resposta for 200 OK ou similar, considera sucesso
    if (response && (response.status === 200 || response.ok || response.success !== false)) {
      console.log('Migração de gastos considerada sucesso');
      return {
        success: true,
        message: 'Gastos migrados com sucesso',
        data: response
      };
    }
    
    // Se tiver erro explícito na resposta
    if (response && response.success === false) {
      console.log('Erro explicito na resposta:', response.message);
      return {
        success: false,
        message: response.message || 'Erro ao migrar gastos'
      };
    }
    
    // Resposta inesperada mas não deu erro HTTP
    console.log('Resposta inesperada, considerando sucesso');
    return {
      success: true,
      message: 'Gastos migrados com sucesso',
      data: response
    };
    
  } catch (error) {
    console.error('Erro ao migrar gastos:', error);
    return {
      success: false,
      message: 'Erro ao migrar gastos'
    };
  }
};

export const getDetalhesGastos = async (categoriaId: number, request: DetalhesRequest) => {
  console.log('getDetalhesGastos chamado com:', { categoriaId, request });
  
  if (isDev()) {
    // Mock response - retorna apenas os tipos que têm gastos no período
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
