import { useState, useEffect } from 'react';
import { podeAcessarSistema, verificarFechamento } from '../services/fechamentoApi';

export interface FechamentoStatus {
  diaFechado: boolean;
  podeAcessar: boolean;
  carregando: boolean;
}

export const useFechamentoControl = (): FechamentoStatus => {
  const [diaFechado, setDiaFechado] = useState(false);
  const [podeAcessar, setPodeAcessar] = useState(true);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    verificarAcesso();
  }, []);

  const verificarAcesso = async () => {
    setCarregando(true);
    
    try {
      const [status, acesso] = await Promise.all([
        verificarFechamento(),
        podeAcessarSistema()
      ]);
      
      setDiaFechado(status.diaFechado);
      setPodeAcessar(acesso);
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      // Em caso de erro, permitir acesso
      setPodeAcessar(true);
    } finally {
      setCarregando(false);
    }
  };

  return {
    diaFechado,
    podeAcessar,
    carregando
  };
};
