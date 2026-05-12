import { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { getCurrentUser } from '../services/api';
import { useFechamentoControl } from './useFechamentoControl';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  role: string | null;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  ROLE: 'auth_role',
  USER_ID: 'auth_user_id',
  LOGIN_TIME: 'auth_login_time'
} as const;

export const useAuth = () => {
  const history = useHistory();
  const { diaFechado } = useFechamentoControl();
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    role: null,
    loading: true,
    error: null
  });

  // Simular sempre online por enquanto
  const isOnline = true;

  // Verificar integridade dos dados no localStorage
  const validateStoredData = useCallback((): boolean => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const user = localStorage.getItem(STORAGE_KEYS.USER);
      const role = localStorage.getItem(STORAGE_KEYS.ROLE);
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const loginTime = localStorage.getItem(STORAGE_KEYS.LOGIN_TIME);

      // Verificar se todos os campos obrigatórios existem
      if (!token || !user || !role || !userId || !loginTime) {
        return false;
      }

      // Verificar se os dados são JSON válidos
      const parsedUser = JSON.parse(user);
      if (!parsedUser.name || !parsedUser.login) {
        return false;
      }

      // Verificar se o login foi feito recentemente (máximo 24h)
      const loginTimestamp = parseInt(loginTime);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas em ms
      
      if (now - loginTimestamp > maxAge) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao validar dados armazenados:', error);
      return false;
    }
  }, []);

  // Limpar dados de autenticação
  const clearAuthData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    setAuthState({
      isAuthenticated: false,
      user: null,
      role: null,
      loading: false,
      error: null
    });
  }, []);

  // Verificar autenticação
  const checkAuth = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    // Verificar conexão com internet
    if (!isOnline) {
      // Offline: verificar apenas dados locais
      if (validateStoredData()) {
        const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)!);
        const role = localStorage.getItem(STORAGE_KEYS.ROLE)!;
        
        setAuthState({
          isAuthenticated: true,
          user,
          role,
          loading: false,
          error: null
        });

        // Se for route e dia fechado, garantir que está na aba correta
        if (role === 'ROUTE' && diaFechado) {
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/route/fechamento') && !currentPath.includes('/route/config')) {
            history.replace('/route/fechamento');
          }
        }
      } else {
        clearAuthData();
        history.replace('/login');
      }
      return;
    }

    // Online: verificar com servidor
    try {
      const userData = await getCurrentUser();
      
      if (userData && userData.name && userData.login && userData.type) {
        // Atualizar localStorage com dados frescos
        localStorage.setItem(STORAGE_KEYS.TOKEN, userData.token || '');
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEYS.ROLE, userData.type);
        localStorage.setItem(STORAGE_KEYS.USER_ID, userData.id.toString());
        localStorage.setItem(STORAGE_KEYS.LOGIN_TIME, Date.now().toString());
        
        setAuthState({
          isAuthenticated: true,
          user: userData,
          role: userData.type,
          loading: false,
          error: null
        });

        // Redirecionar para página correta baseado no role
        const currentPath = window.location.pathname;
        let expectedPath = '';
        
        switch (userData.type) {
          case 'ADMIN':
            expectedPath = '/admin/managers';
            break;
          case 'MANAGER':
            expectedPath = '/manager/routes';
            break;
          case 'ROUTE':
            expectedPath = '/route/config';
            break;
          default:
            expectedPath = '/login';
        }
        
        if (currentPath === '/' || currentPath === '/login') {
          history.replace(expectedPath);
        } else if (userData.type === 'ROUTE' && diaFechado) {
          // Se for route e dia fechado, garantir acesso apenas a fechamento/config
          if (!currentPath.includes('/route/fechamento') && !currentPath.includes('/route/config')) {
            history.replace('/route/fechamento');
          }
        }
      } else {
        throw new Error('Dados inválidos recebidos do servidor');
      }
    } catch (error) {
      console.error('Erro na verificação de autenticação:', error);
      clearAuthData();
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Sessão expirada. Faça login novamente.' 
      }));
      history.replace('/login');
    }
  }, [isOnline, validateStoredData, clearAuthData, history, diaFechado]);

  // Login
  const login = useCallback(async (credentials: { login: string; password: string }) => {
    if (!isOnline) {
      throw new Error('É necessário conexão com internet para fazer login');
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // A lógica de login será implementada no componente Login
      // Este hook apenas gerencia o estado
      await checkAuth();
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro ao fazer login' 
      }));
      throw error;
    }
  }, [isOnline, checkAuth]);

  // Logout
  const logout = useCallback(() => {
    clearAuthData();
    history.replace('/login');
  }, [clearAuthData, history]);

  // Verificar mudanças na conexão
  useEffect(() => {
    if (!isOnline && authState.isAuthenticated) {
      // Perdeu conexão: verificar se dados locais são válidos
      if (!validateStoredData()) {
        logout();
      }
    }
  }, [isOnline, authState.isAuthenticated, validateStoredData, logout]);

  // Verificar mudanças no status de fechamento
  useEffect(() => {
    if (authState.isAuthenticated && authState.role === 'ROUTE') {
      const currentPath = window.location.pathname;
      
      if (diaFechado && !currentPath.includes('/route/fechamento') && !currentPath.includes('/route/config')) {
        history.replace('/route/fechamento');
      }
    }
  }, [diaFechado, authState.isAuthenticated, authState.role, history]);

  // Verificação inicial
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listener para mudanças na aba (visibilidade)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && authState.isAuthenticated) {
        // Usário voltou para a aba, verificar estado
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuth, authState.isAuthenticated]);

  // Listener para foco na janela
  useEffect(() => {
    const handleFocus = () => {
      if (authState.isAuthenticated) {
        checkAuth();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAuth, authState.isAuthenticated]);

  return {
    ...authState,
    login,
    logout,
    checkAuth,
    isOnline,
    diaFechado
  };
};
