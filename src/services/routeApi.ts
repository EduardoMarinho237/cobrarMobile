import { apiRequest, isDev } from './api';

export const createRoute = async (name: string, login: string, password: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Route criado com sucesso'
    };
  }

  try {
    const response = await apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name, login, password }),
    });
    
    // Se a resposta for null (vazia), considera sucesso
    if (response === null) {
      return {
        success: true,
        message: 'Route criado com sucesso'
      };
    }
    
    // Se a resposta já tiver success e message, retorna como está
    if (response && typeof response === 'object' && 'success' in response && 'message' in response) {
      return response;
    }
    
    // Senão, formata resposta de sucesso
    return {
      success: true,
      message: 'Route criado com sucesso',
      data: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão, tente novamente'
    };
  }
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

  // Para endpoints GET, retorna a resposta diretamente
  return apiRequest('/api/users');
};

export const updateRoute = async (id: number, name: string, login: string) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Route atualizado com sucesso'
    };
  }

  try {
    const response = await apiRequest(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, login }),
    });
    
    // Se a resposta for null (vazia), considera sucesso
    if (response === null) {
      return {
        success: true,
        message: 'Route atualizado com sucesso'
      };
    }
    
    // Se a resposta já tiver success e message, retorna como está
    if (response && typeof response === 'object' && 'success' in response && 'message' in response) {
      return response;
    }
    
    // Senão, formata resposta de sucesso
    return {
      success: true,
      message: 'Route atualizado com sucesso',
      data: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão, tente novamente'
    };
  }
};

export const deleteRoute = async (id: number) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Route excluído com sucesso'
    };
  }

  try {
    const response = await apiRequest(`/api/users/${id}`, {
      method: 'DELETE',
    });
    
    // Se a resposta for null (vazia), considera sucesso
    if (response === null) {
      return {
        success: true,
        message: 'Route excluído com sucesso'
      };
    }
    
    // Se a resposta já tiver success e message, retorna como está
    if (response && typeof response === 'object' && 'success' in response && 'message' in response) {
      return response;
    }
    
    // Senão, formata resposta de sucesso
    return {
      success: true,
      message: 'Route excluído com sucesso',
      data: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão, tente novamente'
    };
  }
};
