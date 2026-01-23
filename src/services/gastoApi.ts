import { apiRequest, isDev } from './api';

export interface CategoriaGasto {
  id: number;
  nome: string;
  quantidadeTipos: number;
}

export interface TipoGasto {
  id: number;
  nome: string;
  categoriaId: number;
}

export interface GastoDetalhe {
  tipo: string;
  valor: number;
}

export const getCategorias = async () => {
  if (isDev()) {
    // Mock response
    return [
      {
        id: 1,
        nome: 'Combustível',
        quantidadeTipos: 3
      },
      {
        id: 2,
        nome: 'Alimentação',
        quantidadeTipos: 0
      },
      {
        id: 3,
        nome: 'Manutenção',
        quantidadeTipos: 5
      }
    ];
  }

  return apiRequest('/api/categorias-gastos');
};

export const createCategoria = async (nome: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Categoria criada com sucesso'
    };
  }

  return apiRequest('/api/categorias-gastos', {
    method: 'POST',
    body: JSON.stringify({ nome }),
  });
};

export const updateCategoria = async (id: number, nome: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Categoria atualizada com sucesso'
    };
  }

  return apiRequest(`/api/categorias-gastos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nome }),
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
  
  return apiRequest(`/api/categorias-gastos/${id}`, {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
};

export const getTiposGastos = async (categoriaId: number) => {
  if (isDev()) {
    // Mock response
    return [
      {
        id: 1,
        nome: 'Gasolina',
        categoriaId: categoriaId
      },
      {
        id: 2,
        nome: 'Etanol',
        categoriaId: categoriaId
      },
      {
        id: 3,
        nome: 'Diesel',
        categoriaId: categoriaId
      }
    ];
  }

  return apiRequest(`/api/categorias-gastos/${categoriaId}/tipos`);
};

export const createTipoGasto = async (categoriaId: number, nome: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Tipo de gasto criado com sucesso'
    };
  }

  return apiRequest(`/api/categorias-gastos/${categoriaId}/tipos`, {
    method: 'POST',
    body: JSON.stringify({ nome }),
  });
};

export const updateTipoGasto = async (categoriaId: number, tipoId: number, nome: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Tipo de gasto atualizado com sucesso'
    };
  }

  return apiRequest(`/api/categorias-gastos/${categoriaId}/tipos/${tipoId}`, {
    method: 'PUT',
    body: JSON.stringify({ nome }),
  });
};

export const deleteTipoGasto = async (categoriaId: number, tipoId: number) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Tipo de gasto excluído com sucesso'
    };
  }

  return apiRequest(`/api/categorias-gastos/${categoriaId}/tipos/${tipoId}`, {
    method: 'DELETE',
  });
};

export const getDetalhesGastos = async (categoriaId: number, periodo: string) => {
  if (isDev()) {
    // Mock response
    return {
      total: 1500.50,
      detalhes: [
        {
          tipo: 'Gasolina',
          valor: 800.00
        },
        {
          tipo: 'Etanol',
          valor: 500.00
        },
        {
          tipo: 'Diesel',
          valor: 200.50
        }
      ]
    };
  }

  return apiRequest(`/api/categorias-gastos/${categoriaId}/detalhes?periodo=${periodo}`);
};
