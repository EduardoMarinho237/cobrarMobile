import i18n from '../i18n';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'DEV';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0';

// Event emitter para app desatualizado
let appUpdateCallback: ((message: string, downloadUrl: string) => void) | null = null;

// Flag global para bloquear requisições durante tela de atualização
let appUpdateBlocked = false;

export const setAppUpdateCallback = (callback: (message: string, downloadUrl: string) => void) => {
  appUpdateCallback = callback;
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

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  console.log('apiRequest chamado - endpoint:', endpoint);

  // Priorizar token da chave auth_token (padrão useAuth.ts)
  const token = localStorage.getItem('auth_token');
  
  // Fallback para compatibilidade com código existente
  let user: any = null;
  try {
    const userStr = localStorage.getItem('user');
    user = userStr ? JSON.parse(userStr) : null;
  } catch {}
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

  // Chave de API configurada no .env como VITE_DEV_MODE para bypass dominical
  const envApiKey = import.meta.env.VITE_DEV_MODE;

  // Legacy: chave de API salva no localStorage
  const localApiKey = localStorage.getItem('api_key');

  const apiKey = envApiKey || localApiKey;

  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': currentLanguage,
    'X-Timezone': currentTimezone,
    ...(!skipVersionHeader && { 'X-App-Version': APP_VERSION }),
    ...(finalToken && { Authorization: `Bearer ${finalToken}` }),
    ...(apiKey && { 'X-API-Key': apiKey }),
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
        const downloadUrl = errorData.data?.startsWith('http') ? errorData.data : `${API_BASE_URL}${errorData.data}`;
        if (appUpdateCallback && errorData.message && downloadUrl) {
          appUpdateCallback(errorData.message, downloadUrl);
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
        const downloadUrl = parsed.data?.startsWith('http') ? parsed.data : `${API_BASE_URL}${parsed.data}`;
        if (appUpdateCallback && parsed.message && downloadUrl) {
          appUpdateCallback(parsed.message, downloadUrl);
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
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return false;
  }

  try {
    const response = await apiRequest('/api/auth/checkToken', {
      method: 'GET',
    });

    // Se a resposta indicar dia fechado (vários formatos possíveis), retorna true para permitir acesso
    const isClosedDay =
      response?.data === 'closed-day' ||
      response?.data?.data === 'closed-day' ||
      response?.data === 'closed' ||
      response?.closedDay === true ||
      response?.closed_day === true;

    if (isClosedDay) {
      console.log('checkToken: dia fechado detectado, permitindo acesso');
      return true;
    }

    return response?.success === true && response?.data?.valid === true;
  } catch (error: any) {
    console.error('Erro ao validar token:', error);
    // Se o erro for dia fechado, permite acesso
    const isClosedDay =
      error?.data === 'closed-day' ||
      error?.data?.data === 'closed-day' ||
      error?.closedDay === true;
    if (isClosedDay) {
      console.log('checkToken: dia fechado (catch), permitindo acesso');
      return true;
    }
    return false;
  }
};

export const logout = async () => {
  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Erro ao encerrar sessão no servidor:', error);
  } finally {
    clearSessionData();
    window.location.replace('/login');
  }
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const createManager = async (name: string, login: string, password: string) => {
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
  return apiRequest('/api/users');
};

export const updateManager = async (id: number, name: string, login: string) => {
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
  const requestBody = JSON.stringify({ newPassword });
  console.log('Enviando request para alterar senha:', requestBody);

  return apiRequest(`/api/users/${id}/change-password`, {
    method: 'PUT',
    body: requestBody,
  });
};
