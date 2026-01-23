import { apiRequest, isDev } from './api';

export const createRoute = async (name: string, login: string, password: string) => {
  if (isDev()) {
    // Mock response
    return {
      success: true,
      message: 'Route criado com sucesso'
    };
  }

  return apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify({ name, login, password }),
  });
};

export const getRoutes = async () => {
  if (isDev()) {
    // Mock response
    return [
      {
        id: 8,
        name: 'Carlos Route',
        login: 'carlos.route',
        role: 'ROUTE',
        lastAccess: null
      },
      {
        id: 9,
        name: 'Ana Route',
        login: 'ana.route',
        role: 'ROUTE',
        lastAccess: '2024-01-15T10:30:00Z'
      }
    ];
  }

  return apiRequest('/api/users');
};

export const updateRoute = async (id: number, name: string, login: string) => {
  if (isDev()) {
    // Mock response
    return {
      success: true,
      message: 'Route atualizado com sucesso'
    };
  }

  return apiRequest(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, login }),
  });
};

export const deleteRoute = async (id: number) => {
  if (isDev()) {
    // Mock response
    return {
      success: true,
      message: 'Route excluído com sucesso'
    };
  }

  return apiRequest(`/api/users/${id}`, {
    method: 'DELETE',
  });
};
