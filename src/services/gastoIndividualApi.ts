import { apiRequest, isDev } from './api';
import { getCategorias, getTiposGastos, CategoriaGasto, TipoGasto } from './gastoApi';

export interface Gasto {
  id: number;
  categoriaId: number;
  tipoId: number;
  categoriaNome: string;
  tipoNome: string;
  valor: number;
  descricao: string;
  data: string;
}

export interface GastoForm {
  categoriaId: number;
  tipoId: number;
  valor: number;
  descricao: string;
}

export const getGastosDoDia = async () => {
  if (isDev()) {
    // Mock response
    return [
      {
        id: 1,
        categoriaId: 1,
        tipoId: 1,
        categoriaNome: 'Combustível',
        tipoNome: 'Gasolina',
        valor: 150,
        descricao: 'Abastecimento carro',
        data: new Date().toISOString()
      },
      {
        id: 2,
        categoriaId: 2,
        tipoId: 4,
        categoriaNome: 'Alimentação',
        tipoNome: 'Almoço',
        valor: 45,
        descricao: 'Almoço no restaurante',
        data: new Date().toISOString()
      },
      {
        id: 3,
        categoriaId: 1,
        tipoId: 2,
        categoriaNome: 'Combustível',
        tipoNome: 'Etanol',
        valor: 80,
        descricao: 'Abastecimento moto',
        data: new Date().toISOString()
      }
    ];
  }

  return apiRequest('/api/gastos/dia');
};

export const createGasto = async (gasto: GastoForm) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Gasto criado com sucesso'
    };
  }

  return apiRequest('/api/gastos', {
    method: 'POST',
    body: JSON.stringify(gasto),
  });
};

export const updateGasto = async (id: number, gasto: GastoForm) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Gasto atualizado com sucesso'
    };
  }

  return apiRequest(`/api/gastos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(gasto),
  });
};

export const deleteGasto = async (id: number) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Gasto excluído com sucesso'
    };
  }

  return apiRequest(`/api/gastos/${id}`, {
    method: 'DELETE',
  });
};

export const getTotalGastosDia = async () => {
  if (isDev()) {
    return {
      total: 275
    };
  }

  return apiRequest('/api/gastos/dia/total');
};
