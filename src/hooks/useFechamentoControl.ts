import { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';

export interface FechamentoStatus {
  diaFechado: boolean;
  podeAcessar: boolean;
  carregando: boolean;
}

export const useFechamentoControl = (): FechamentoStatus => {
  const [diaFechado, setDiaFechado] = useState(false);
  const [podeAcessar, setPodeAcessar] = useState(true);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    // Verificar status de fechamento baseado no usuário logado
    const verificarStatus = () => {
      try {
        const currentUser = getCurrentUser();
        
        if (currentUser && currentUser.role === 'ROUTE') {
          // Para usuários ROUTE, verificar o campo closedDay
          const isDayClosed = currentUser.closedDay === true;
          setDiaFechado(isDayClosed);
          setPodeAcessar(!isDayClosed); // Se dia fechado, não pode acessar outras funcionalidades
          
          console.log('Status fechamento ROUTE:', {
            closedDay: currentUser.closedDay,
            diaFechado: isDayClosed,
            podeAcessar: !isDayClosed
          });
        } else {
          // Para outros roles, sempre permite acesso
          setDiaFechado(false);
          setPodeAcessar(true);
        }
      } catch (error) {
        console.error('Erro ao verificar status de fechamento:', error);
        // Em caso de erro, permitir acesso
        setDiaFechado(false);
        setPodeAcessar(true);
      }
    };

    verificarStatus();
    
    // Opcional: verificar periodicamente se necessário
    // const interval = setInterval(verificarStatus, 60000); // Cada minuto
    // return () => clearInterval(interval);
  }, []);

  return {
    diaFechado,
    podeAcessar,
    carregando
  };
};
