import { apiRequest } from './api';
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
  return apiRequest('/api/gastos/dia');
};

export const createGasto = async (gasto: GastoForm) => {
  return apiRequest('/api/gastos', {
    method: 'POST',
    body: JSON.stringify(gasto),
  });
};

export const updateGasto = async (id: number, gasto: GastoForm) => {
  return apiRequest(`/api/gastos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(gasto),
  });
};

export const deleteGasto = async (id: number) => {
  return apiRequest(`/api/gastos/${id}`, {
    method: 'DELETE',
  });
};

export const getTotalGastosDia = async () => {
  return apiRequest('/api/gastos/dia/total');
};
