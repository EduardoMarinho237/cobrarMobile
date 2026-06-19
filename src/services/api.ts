import i18n from '../i18n';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'DEV';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0';

export const isDev = () => API_BASE_URL === 'DEV';

// Event emitter para app desatualizado
let appUpdateCallback: ((message: string, downloadUrl: string) => void) | null = null;

// Flag global para controlar se o modal já foi aberto
let updateModalOpened = false;

// Flag global para bloquear requisições durante tela de atualização
let appUpdateBlocked = false;

export const setAppUpdateCallback = (callback: (message: string, downloadUrl: string) => void) => {
  appUpdateCallback = callback;
};

export const resetUpdateModalFlag = () => {
  updateModalOpened = false;
};

export const setAppUpdateBlocked = (blocked: boolean) => {
  appUpdateBlocked = blocked;
  console.log('[api.ts] appUpdateBlocked =', blocked);
};

export const isAppUpdateBlocked = () => appUpdateBlocked;

// Importar o event emitter (importação dinâmica para evitar circular dependency)
let fechamentoEvents: any = null;
const getFechamentoEvents = () => {
  if (!fechamentoEvents) {
    // Importação dinâmica para evitar circular dependency
    import('../hooks/useFechamentoControl').then(module => {
      fechamentoEvents = module.fechamentoEvents;
    });
  }
  return fechamentoEvents;
};

// Timezone fixo: America/Sao_Paulo
localStorage.setItem('timezone', 'America/Sao_Paulo');

console.log('API_BASE_URL:', API_BASE_URL);
console.log('isDev():', isDev());

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  console.log('apiRequest chamado - endpoint:', endpoint);
  console.log('isDev():', isDev());
  
  if (isDev()) {
    console.log('Retornando null (modo mock)');
    return null; // Mock mode
  }

  // Bloquear requisições durante tela de atualização (exceto logout)
  const isLogoutEndpoint = endpoint === '/api/auth/logout';
  const isPublicDownload = !endpoint.startsWith('/api');
  if (appUpdateBlocked && !isLogoutEndpoint && !isPublicDownload) {
    console.log('[apiRequest] Bloqueado - app em tela de atualização:', endpoint);
    return {
      success: false,
      message: 'App desatualizado - atualização necessária',
      blockedByUpdate: true,
    };
  }

  // Priorizar token da chave auth_token (padrão useAuth.ts)
  const token = localStorage.getItem('auth_token');
  
  // Fallback para compatibilidade com código existente
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const fallbackToken = user?.token;
  
  const finalToken = token || fallbackToken;
  const currentLanguage = localStorage.getItem('language') || 'pt-BR';
  const currentTimezone = 'America/Sao_Paulo';

  console.log('apiRequest - user from localStorage:', user);
  console.log('apiRequest - token from auth_token:', token);
  console.log('apiRequest - fallbackToken from user:', fallbackToken);
  console.log('apiRequest - finalToken being used:', finalToken);
  console.log('apiRequest - endpoint:', endpoint);
  console.log('apiRequest - language:', currentLanguage);

  // Verificar se endpoint é exceção (não precisa de X-App-Version)
  const isAuthEndpoint = endpoint.startsWith('/api/auth');
  const isLoginEndpoint = endpoint === '/api/auth/login';
  const isPublicEndpoint = endpoint.startsWith('/api/public');
  const skipVersionHeader = isAuthEndpoint || isPublicEndpoint;

  // API key para bypass de bloqueio dominical
  const apiKey = localStorage.getItem('api_key');

  // Modo desenvolvimento para bypass de regras de domingo
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'TRUE';

  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': currentLanguage,
    'X-Timezone': currentTimezone,
    ...(!skipVersionHeader && { 'X-App-Version': APP_VERSION }),
    ...(finalToken && { Authorization: `Bearer ${finalToken}` }),
    ...(apiKey && { 'X-API-Key': apiKey }),
    ...(isDevMode && { 'X-Dev-Mode': 'true' }),
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

    if (response.status === 401) {
      // Para o endpoint de login, não limpa sessão nem redireciona
      if (isLoginEndpoint) {
        console.log('Login retornou 401 - retornando resposta da API');
        try {
          const errorText = await response.text();
          const errorData = errorText ? JSON.parse(errorText) : null;
          return errorData;
        } catch (e) {
          return null;
        }
      }

      console.log('Token expirado (401) - limpando sessão e redirecionando');
      clearSessionData();
      (window as any).globalToast?.('Sesión vencida');

      setTimeout(() => {
        window.location.replace('/login');
      }, 800);

      return null;
    }

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

      // Para o endpoint de login, retorna o erro bruto sem tratamentos especiais
      if (isLoginEndpoint) {
        return errorData;
      }

      // Verificar se é erro de app desatualizado (needToUpdate: true)
      if (errorData && errorData.needToUpdate === true) {
        console.log('App desatualizado detectado:', errorData);
        if (!updateModalOpened) {
          const downloadUrl = errorData.data?.startsWith('http') ? errorData.data : `${API_BASE_URL}${errorData.data}`;
          if (appUpdateCallback && errorData.message && downloadUrl) {
            updateModalOpened = true;
            appUpdateCallback(errorData.message, downloadUrl);
          }
        }
        return errorData;
      }

      // Verificar se é erro de dia fechado, usuário bloqueado ou manutenção dominical
      if (errorData && (errorData.data === "closed-day" || errorData.data === "blocked" || errorData.data === "sunday-maintenance")) {
        console.log('Estado especial detectado na resposta da API:', errorData.data);
        
        if (errorData.data === "sunday-maintenance") {
          console.log('Manutenção dominical, redirecionando para página de bloqueio dominical');
          if (window.location.pathname !== '/sunday-blocked') {
            window.location.replace('/sunday-blocked');
          }
          return;
        }
        
        // Emitir evento para o hook
        const events = getFechamentoEvents();
        if (events) {
          events.emit(true); // true = dia fechado/bloqueado
        }
        
        // Se for "blocked", redireciona para página de bloqueio (bloqueio total)
        if (errorData.data === "blocked") {
          console.log('Usuário bloqueado, redirecionando para página de bloqueio');
          localStorage.removeItem('user'); // Remove usuário do localStorage
          window.location.replace('/route/blocked');
          return;
        }
        
        // Se for "closed-day", redireciona para tela de fechamento
        if (window.location.pathname !== '/route/fechamento') {
          window.location.replace('/route/fechamento');
        }
      }
      
      // Retorna o erro diretamente em vez de lançar exceção
      return errorData || { success: false, message: i18n.t('common.connectionError') };
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
      
      // Se a resposta não tiver "closed-day", emitir evento de dia aberto
      if (parsed && parsed.data !== "closed-day") {
        const events = getFechamentoEvents();
        if (events) {
          events.emit(false); // false = dia aberto
        }
      }
      
      // Verificar se resposta de sucesso tem needToUpdate
      if (parsed && parsed.needToUpdate === true) {
        console.log('App desatualizado detectado (sucesso):', parsed);
        if (!updateModalOpened) {
          const downloadUrl = parsed.data?.startsWith('http') ? parsed.data : `${API_BASE_URL}${parsed.data}`;
          if (appUpdateCallback && parsed.message && downloadUrl) {
            updateModalOpened = true;
            appUpdateCallback(parsed.message, downloadUrl);
          }
        }
        return parsed;
      }
      
      return parsed;
    } catch (error) {
      console.error('Erro ao fazer parse do JSON:', error);
      console.error('Resposta bruta:', text);
      throw new Error(i18n.t('common.connectionError'));
    }
  } catch (error) {
    console.error('Erro no apiRequest:', error);

    // Se for erro de rede ou conexão, usa mensagem padrão
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(i18n.t('common.connectionError'));
    }

    // Se já for uma mensagem de erro personalizada, propaga
    throw error;
  }
};

export const login = async (login: string, password: string, rememberMe = false) => {
  console.log('=== INÍCIO DO LOGIN ===');
  console.log('Login para:', login);
  console.log('isDev():', isDev());
  
  if (isDev()) {
    console.log('Usando modo mock');
    // Mock login
    const mockUsers = {
      admin: { password: 'admin', name: 'ADM', role: 'ADMIN', token: 'mock-token-admin', closedDay: false },
      manager: { password: 'manager', name: 'Manager', role: 'MANAGER', token: 'mock-token-manager', closedDay: false },
      route: { password: 'route', name: 'Route', role: 'ROUTE', token: 'mock-token-route', closedDay: false }
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
        type: 'Bearer',
        closedDay: user.closedDay
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
      body: JSON.stringify({ login, password, rememberMe }),
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
    
    // Salva o closedDay no localStorage separadamente se existir
    if (userData.closedDay !== undefined) {
      localStorage.setItem('closedDay', JSON.stringify(userData.closedDay));
    }
    
    console.log('Login API successful:', result);
    console.log('=== FIM DO LOGIN (SUCESSO) ===');
    return result;
  } catch (error) {
    console.error('Erro no login API:', error);
    console.log('=== FIM DO LOGIN (ERRO) ===');
    throw error;
  }
};

export const clearSessionData = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('auth_role');
  localStorage.removeItem('auth_user_id');
  localStorage.removeItem('auth_login_time');
  localStorage.removeItem('user');
  localStorage.removeItem('closedDay');
};

export const checkToken = async (): Promise<boolean> => {
  if (isDev()) {
    return !!localStorage.getItem('auth_token');
  }

  const token = localStorage.getItem('auth_token');
  if (!token) {
    return false;
  }

  try {
    const response = await apiRequest('/api/auth/checkToken', {
      method: 'GET',
    });

    return response?.success === true && response?.data?.valid === true;
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return false;
  }
};

export const logout = async () => {
  try {
    if (!isDev()) {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
    }
  } catch (error) {
    console.error('Erro ao encerrar sessão no servidor:', error);
  } finally {
    clearSessionData();
    window.location.replace('/login');
  }
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
      message: i18n.t('common.connectionError')
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
      message: i18n.t('common.connectionError')
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
      message: i18n.t('common.connectionError')
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
      message: i18n.t('common.connectionError')
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
