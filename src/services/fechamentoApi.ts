import { apiRequest, isDev } from './api';

export interface FechamentoData {
  expectativaArrecadacao: number;
  arrecadacaoDia: number;
  clientesCobrados: number;
  gastosDia: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
}

export const getFechamentoData = async () => {
  if (isDev()) {
    // Mock response
    return {
      expectativaArrecadacao: 2500.00,
      arrecadacaoDia: 1875.50,
      clientesCobrados: 15,
      gastosDia: 125.00
    };
  }

  return apiRequest('/api/fechamento/dados');
};

export const fecharDia = async () => {
  if (isDev()) {
    return {
      success: true,
      message: 'Dia fechado com sucesso'
    };
  }

  return apiRequest('/api/fechamento/fechar', {
    method: 'POST'
  });
};

export const verificarFechamento = async () => {
  if (isDev()) {
    // Mock response - simula que o dia não está fechado
    return {
      diaFechado: false,
      horarioFechamento: null
    };
  }

  return apiRequest('/api/fechamento/verificar');
};

export const getLocation = async (): Promise<LocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  });
};

export const getCurrentTimeByLocation = async (location: LocationData): Promise<Date> => {
  if (isDev()) {
    // Mock - retorna data atual
    return new Date();
  }

  try {
    // Usar API de timezone baseada na localização
    const response = await fetch(
      `https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=position&lat=${location.latitude}&lng=${location.longitude}`
    );
    
    if (!response.ok) {
      throw new Error('Erro ao obter horário');
    }
    
    const data = await response.json();
    return new Date(data.formatted);
  } catch (error) {
    // Fallback para API alternativa
    try {
      const response = await fetch(
        `https://worldtimeapi.org/api/timezone?lat=${location.latitude}&lng=${location.longitude}`
      );
      
      if (!response.ok) {
        throw new Error('Erro ao obter horário');
      }
      
      const data = await response.json();
      return new Date(data.datetime);
    } catch (fallbackError) {
      // Último fallback - retorna data local (não ideal mas evita quebra)
      console.warn('Usando fallback para horário local');
      return new Date();
    }
  }
};

export const podeAcessarSistema = async (): Promise<boolean> => {
  try {
    const fechamentoStatus = await verificarFechamento();
    
    if (!fechamentoStatus.diaFechado) {
      return true;
    }
    
    // Se dia está fechado, verificar horário atual
    const location = await getLocation();
    const currentTime = await getCurrentTimeByLocation(location);
    const fechamentoTime = new Date(fechamentoStatus.horarioFechamento);
    
    // Verificar se já passou 00:00 do dia seguinte
    const proximoDia = new Date(fechamentoTime);
    proximoDia.setDate(proximoDia.getDate() + 1);
    proximoDia.setHours(0, 0, 0, 0);
    
    return currentTime >= proximoDia;
  } catch (error) {
    // Em caso de erro, permitir acesso para não bloquear o usuário
    console.error('Erro ao verificar acesso:', error);
    return true;
  }
};
