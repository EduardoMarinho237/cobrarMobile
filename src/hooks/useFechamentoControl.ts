import { useState, useEffect } from 'react';
import { getCurrentUser, apiRequest, isDev } from '../services/api';

// Event emitter para comunicação entre o interceptador e o hook
const fechamentoEvents = {
  listeners: [] as ((diaFechado: boolean) => void)[],
  subscribe: (callback: (diaFechado: boolean) => void) => {
    fechamentoEvents.listeners.push(callback);
  },
  unsubscribe: (callback: (diaFechado: boolean) => void) => {
    fechamentoEvents.listeners = fechamentoEvents.listeners.filter(l => l !== callback);
  },
  emit: (diaFechado: boolean) => {
    fechamentoEvents.listeners.forEach(listener => listener(diaFechado));
  }
};

export interface FechamentoStatus {
  diaFechado: boolean;
  podeAcessar: boolean;
  carregando: boolean;
  verificando: boolean;
}

export const useFechamentoControl = (): FechamentoStatus & { verificarStatus: () => Promise<void> } => {
  const [diaFechado, setDiaFechado] = useState(false);
  const [podeAcessar, setPodeAcessar] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState(false); // Novo estado para controle visual

  // Função para atualizar o status do usuário no localStorage
  const atualizarStatusUsuario = (novoStatus: boolean) => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      currentUser.closedDay = novoStatus;
      localStorage.setItem('user', JSON.stringify(currentUser));
    }
  };

  // Função para atualizar o estado
  const atualizarEstado = (isDayClosed: boolean, forcarVerificacao = false) => {
    // Se estiver verificando manualmente, não atualiza o estado visual ainda
    if (forcarVerificacao) {
      setCarregando(true);
      return; // Não atualiza o estado durante a verificação
    }
    
    setDiaFechado(isDayClosed);
    setPodeAcessar(!isDayClosed);
    atualizarStatusUsuario(isDayClosed);
    
    console.log('Status fechamento atualizado:', {
      diaFechado: isDayClosed,
      podeAcessar: !isDayClosed
    });
  };

  // Função para verificar status na API
  const verificarStatusNaAPI = async () => {
    if (isDev()) {
      // Em modo dev, sempre retorna dia aberto
      return false;
    }

    try {
      // Tenta fazer uma chamada simples para qualquer endpoint
      // Se responder com 200 e sem data: "closed-day" ou "blocked", o dia está aberto
      const response = await apiRequest('/api/clients');
      return false; // Se chegou aqui, o dia está aberto
    } catch (error: any) {
      // Se houver erro 403 ou data: "closed-day" ou "blocked", o dia está fechado/bloqueado
      if (error && (error.status === 403 || error.data === "closed-day" || error.data === "blocked")) {
        return true;
      }
      return false; // Em caso de outros erros, assume que está aberto
    }
  };

  // Função principal de verificação
  const verificarStatus = async (forcarAPI = false) => {
    try {
      const currentUser = getCurrentUser();
      
      if (currentUser && currentUser.role === 'ROUTE') {
        if (forcarAPI) {
          // Força verificação na API
          setVerificando(true);
          setCarregando(true);
          
          const isDayClosed = await verificarStatusNaAPI();
          
          console.log('Verificação manual concluída:', { isDayClosed, estadoAtual: diaFechado });
          
          // Só atualiza o estado se realmente mudou
          if (isDayClosed !== diaFechado) {
            console.log('Status mudou, atualizando interface');
            setDiaFechado(isDayClosed);
            setPodeAcessar(!isDayClosed);
            atualizarStatusUsuario(isDayClosed);
          } else {
            console.log('Status não mudou, mantendo interface');
          }
        } else {
          // Usa o status do localStorage
          const isDayClosed = currentUser.closedDay === true;
          atualizarEstado(isDayClosed);
        }
      } else {
        // Para outros roles, sempre permite acesso
        atualizarEstado(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status de fechamento:', error);
      // Em caso de erro, permitir acesso
      atualizarEstado(false);
    } finally {
      setCarregando(false);
      setVerificando(false);
    }
  };

  useEffect(() => {
    // Verificação inicial
    verificarStatus();

    // Inscreve para receber eventos do interceptador
    const handleFechamentoEvent = (diaFechado: boolean) => {
      console.log('Evento de fechamento recebido:', diaFechado);
      
      // Se estiver verificando manualmente, não atualiza o estado
      if (verificando) {
        console.log('Verificação em andamento, ignorando evento');
        return;
      }
      
      atualizarEstado(diaFechado);
    };

    fechamentoEvents.subscribe(handleFechamentoEvent);

    // Cleanup
    return () => {
      fechamentoEvents.unsubscribe(handleFechamentoEvent);
    };
  }, []);

  return {
    diaFechado,
    podeAcessar,
    carregando,
    verificando,
    verificarStatus: () => verificarStatus(true) // Função para forçar verificação na API
  };
};

// Exportar o event emitter para uso no interceptador
export { fechamentoEvents };
