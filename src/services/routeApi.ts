import { apiRequest, isDev } from './api';

export const createRoute = async (name: string, login: string, password: string, tax: number) => {
  try {
    const response = await apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name, login, password, tax }),
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
  // Para endpoints GET, retorna a resposta diretamente da API real
  return apiRequest('/api/users');
};

export const updateRoute = async (id: number, name: string, login: string, tax: number) => {
  try {
    const response = await apiRequest(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, login, tax }),
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
