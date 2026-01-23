const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'DEV';

export const isDev = () => API_BASE_URL === 'DEV';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  if (isDev()) {
    return null; // Mock mode
  }

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Adiciona o token de autenticação se existir
  if (user && user.token) {
    headers.Authorization = `${user.type || 'Bearer'} ${user.token}`;
  }
  
  const response = await fetch(url, {
    headers,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
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

  return apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify({ name, login, password }),
  });
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
        lastAccess: null
      },
      {
        id: 6,
        name: 'Maria Manager',
        login: 'maria.manager',
        role: 'MANAGER',
        lastAccess: '2024-01-15T10:30:00Z'
      }
    ];
  }

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

  return apiRequest(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, login }),
  });
};

export const toggleManagerAudit = async (id: number, appearOnAudit: boolean) => {
  if (isDev()) {
    // Mock response
    return {
      success: true,
      message: appearOnAudit ? 'Acesso restaurado com sucesso' : 'Acesso restrito com sucesso'
    };
  }

  return apiRequest(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ appearOnAudit }),
  });
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
