const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'DEV';

export const isDev = () => API_BASE_URL === 'DEV';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  if (isDev()) {
    return null; // Mock mode
  }

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const token = user?.token;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      // Tenta obter o corpo da resposta de erro
      let errorData = null;
      try {
        const errorText = await response.text();
        if (errorText) {
          errorData = JSON.parse(errorText);
        }
      } catch (e) {
        // Se não conseguir parsear, continua sem os dados
      }
      
      // Retorna o erro diretamente em vez de lançar exceção
      return errorData || { success: false, message: 'Erro de conexão, tente novamente' };
    }

    // Tratar respostas vazias ou sem conteúdo
    const text = await response.text();
    if (!text) {
      return null; // Resposta vazia
    }
    
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Erro ao fazer parse do JSON:', error);
      console.error('Resposta bruta:', text);
      throw new Error('Erro de conexão, tente novamente');
    }
  } catch (error) {
    // Se for erro de rede ou conexão, usa mensagem padrão
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Erro de conexão, tente novamente');
    }
    
    // Se já for uma mensagem de erro personalizada, propaga
    throw error;
  }
};

export const login = async (login: string, password: string) => {
  if (isDev()) {
    // Mock login
    const mockUsers = {
      admin: { password: 'admin', name: 'ADM', role: 'ADMIN', token: 'mock-token-admin' },
      manager: { password: 'manager', name: 'Manager', role: 'MANAGER', token: 'mock-token-manager' },
      route: { password: 'route', name: 'Route', role: 'ROUTE', token: 'mock-token-route' }
    };
    
    const user = mockUsers[login as keyof typeof mockUsers];
    if (user && user.password === password) {
      return {
        name: user.name,
        login: login,
        role: user.role,
        token: user.token,
        userId: 1,
        type: 'Bearer'
      };
    }
    throw new Error('Credenciais inválidas');
  }

  // Real API login
  const response = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });

  // Adiciona o campo login na resposta da API real
  return {
    ...response,
    login: login
  };
};

export const logout = () => {
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const createManager = async (name: string, login: string, password: string) => {
  if (isDev()) {
    // Mock response
    return {
      success: true,
      message: 'Manager criado com sucesso'
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
        message: 'Manager criado com sucesso'
      };
    }
    
    // Se a resposta já tiver success e message, retorna como está
    if (response && typeof response === 'object' && 'success' in response && 'message' in response) {
      return response;
    }
    
    // Senão, formata resposta de sucesso
    return {
      success: true,
      message: 'Manager criado com sucesso',
      data: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão, tente novamente'
    };
  }
};

export const getManagers = async () => {
  if (isDev()) {
    // Mock response
    return [
      {
        id: 5,
        name: 'Juan Manager',
        login: 'juan.manager',
        role: 'MANAGER',
        lastAccess: null,
        appearOnAudit: true
      },
      {
        id: 6,
        name: 'Maria Manager',
        login: 'maria.manager',
        role: 'MANAGER',
        lastAccess: '2024-01-15T10:30:00Z',
        appearOnAudit: false
      }
    ];
  }

  // Para endpoints GET, retorna a resposta diretamente
  return apiRequest('/api/users');
};

export const updateManager = async (id: number, name: string, login: string) => {
  if (isDev()) {
    // Mock response
    return {
      success: true,
      message: 'Manager atualizado com sucesso'
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
        message: 'Manager atualizado com sucesso'
      };
    }
    
    // Se a resposta já tiver success e message, retorna como está
    if (response && typeof response === 'object' && 'success' in response && 'message' in response) {
      return response;
    }
    
    // Senão, formata resposta de sucesso
    return {
      success: true,
      message: 'Manager atualizado com sucesso',
      data: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão, tente novamente'
    };
  }
};

export const toggleManagerAudit = async (id: number, appearOnAudit: boolean) => {
  if (isDev()) {
    // Mock response
    return {
      success: true,
      message: appearOnAudit ? 'Acesso restaurado com sucesso' : 'Acesso restrito com sucesso'
    };
  }

  try {
    const response = await apiRequest(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ appearOnAudit }),
    });
    
    // Se a resposta for null (vazia), considera sucesso
    if (response === null) {
      return {
        success: true,
        message: appearOnAudit ? 'Acesso restaurado com sucesso' : 'Acesso restrito com sucesso'
      };
    }
    
    // Se a resposta já tiver success e message, retorna como está
    if (response && typeof response === 'object' && 'success' in response && 'message' in response) {
      return response;
    }
    
    // Senão, formata resposta de sucesso
    return {
      success: true,
      message: appearOnAudit ? 'Acesso restaurado com sucesso' : 'Acesso restrito com sucesso',
      data: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão, tente novamente'
    };
  }
};

export const changeManagerPassword = async (id: number, newPassword: string) => {
  if (isDev()) {
    // Mock response
    return {
      success: true,
      message: 'Senha alterada com sucesso'
    };
  }

  return apiRequest(`/api/users/${id}/change-password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword }),
  });
};
