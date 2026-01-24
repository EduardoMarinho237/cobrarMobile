const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'DEV';

export const isDev = () => API_BASE_URL === 'DEV';

console.log('API_BASE_URL:', API_BASE_URL);
console.log('isDev():', isDev());

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  console.log('apiRequest chamado - endpoint:', endpoint);
  console.log('isDev():', isDev());
  
  if (isDev()) {
    console.log('Retornando null (modo mock)');
    return null; // Mock mode
  }

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const token = user?.token;

  console.log('apiRequest - user from localStorage:', user);
  console.log('apiRequest - token:', token);
  console.log('apiRequest - endpoint:', endpoint);

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  console.log('apiRequest - headers:', headers);

  const url = `${API_BASE_URL}${endpoint}`;
  console.log('apiRequest - URL completa:', url);
  
  try {
    console.log('Enviando requisição fetch...');
    const response = await fetch(url, {
      headers,
      ...options,
    });
    console.log('Resposta fetch recebida - status:', response.status);

    if (!response.ok) {
      // Tenta obter o corpo da resposta de erro
      let errorData = null;
      try {
        const errorText = await response.text();
        console.log('Texto de erro:', errorText);
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
    console.log('Resposta texto bruta:', text);
    
    if (!text) {
      console.log('Resposta vazia, retornando null');
      return null; // Resposta vazia
    }
    
    try {
      const parsed = JSON.parse(text);
      console.log('JSON parseado com sucesso:', parsed);
      return parsed;
    } catch (error) {
      console.error('Erro ao fazer parse do JSON:', error);
      console.error('Resposta bruta:', text);
      throw new Error('Erro de conexão, tente novamente');
    }
  } catch (error) {
    console.error('Erro no apiRequest:', error);
    // Se for erro de rede ou conexão, usa mensagem padrão
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Erro de conexão, tente novamente');
    }
    
    // Se já for uma mensagem de erro personalizada, propaga
    throw error;
  }
};

export const login = async (login: string, password: string) => {
  console.log('=== INÍCIO DO LOGIN ===');
  console.log('Login para:', login);
  console.log('isDev():', isDev());
  
  if (isDev()) {
    console.log('Usando modo mock');
    // Mock login
    const mockUsers = {
      admin: { password: 'admin', name: 'ADM', role: 'ADMIN', token: 'mock-token-admin' },
      manager: { password: 'manager', name: 'Manager', role: 'MANAGER', token: 'mock-token-manager' },
      route: { password: 'route', name: 'Route', role: 'ROUTE', token: 'mock-token-route' }
    };
    
    const user = mockUsers[login as keyof typeof mockUsers];
    if (user && user.password === password) {
      console.log('Login mock successful:', user);
      return {
        name: user.name,
        login: login,
        role: user.role,
        token: user.token,
        userId: 1,
        type: 'Bearer'
      };
    }
    console.log('Credenciais mock inválidas');
    throw new Error('Credenciais inválidas');
  }

  // Real API login
  console.log('Fazendo requisição para API real...');
  try {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    });

    console.log('Resposta da API recebida:', response);
    console.log('Tipo da resposta:', typeof response);
    console.log('Chaves da resposta:', response ? Object.keys(response) : 'null/undefined');

    // Verifica se a resposta é um erro
    if (response && typeof response === 'object' && 'success' in response && !response.success) {
      console.log('API retornou erro:', response.message);
      throw new Error(response.message || 'Erro ao fazer login');
    }

    // Extrai os dados da resposta da API
    let userData = response;
    if (response && typeof response === 'object' && 'data' in response) {
      console.log('Extraindo dados de response.data');
      userData = response.data;
      console.log('userData extraído:', userData);
    }

    // Verifica se temos dados válidos
    if (!userData || typeof userData !== 'object') {
      console.error('Dados do usuário inválidos:', userData);
      throw new Error('Resposta inválida do servidor');
    }

    // Verifica se temos os campos necessários
    if (!userData.role) {
      console.error('Campo role ausente em userData:', userData);
      throw new Error('Campo role não encontrado na resposta');
    }

    // Adiciona o campo login nos dados do usuário
    const result = {
      ...userData,
      login: login
    };
    console.log('Login API successful:', result);
    console.log('=== FIM DO LOGIN (SUCESSO) ===');
    return result;
  } catch (error) {
    console.error('Erro no login API:', error);
    console.log('=== FIM DO LOGIN (ERRO) ===');
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('user');
  window.location.replace('/login');
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

export const toggleRouteAudit = async (id: number, appearOnAudit: boolean) => {
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

  const requestBody = JSON.stringify({ newPassword });
  console.log('Enviando request para alterar senha:', requestBody);

  return apiRequest(`/api/users/${id}/change-password`, {
    method: 'PUT',
    body: requestBody,
  });
};
