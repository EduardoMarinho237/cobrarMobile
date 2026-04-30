import { apiRequest, isDev } from './api';

export interface FechamentoData {
  expectativaArrecadacao: number;
  arrecadacaoDia: number;
  clientesCobrados: number;
  gastosDia: number;
}

export interface DailyScheduleResponse {
  success: boolean;
  message: string;
  data: {
    pendingPayments: Array<{
      installmentValue: number;
      clientId: number;
      clientName: string;
      creditId: number;
      remainingInstallments: number;
      finalDate: string;
      hasOverdueInstallments: boolean;
      overdueInstallmentsCount: number;
      accumulatedOverdueValue: number;
    }>;
    dailyExpectation: number;
    collectedToday: number;
    remainingToCollect: number;
  };
}

export interface ExpensesResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: number;
    expenseTypeId: number;
    value: number;
    description: string;
    createdAt: string;
  }>;
}

export interface ClientsResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: number;
    name: string;
    phone: string;
    address: string;
  }>;
}

export interface LocationData {
  latitude: number;
  longitude: number;
}

export const getFechamentoData = async (): Promise<FechamentoData> => {
  if (isDev()) {
    // Mock response atualizado com base nos novos endpoints
    return {
      expectativaArrecadacao: 500,
      arrecadacaoDia: 300,
      clientesCobrados: 3,
      gastosDia: 80
    };
  }

  try {
    console.log('Buscando dados do fechamento...');
    
    // 1. Buscar agenda diária - contém expectativa e arrecadação
    const scheduleResponse: DailyScheduleResponse = await apiRequest('/api/debits/build_daily_schedule');
    console.log('Resposta agenda diária:', scheduleResponse);
    
    // 2. Buscar todas as despesas
    const expensesResponse: ExpensesResponse = await apiRequest('/api/expenses');
    console.log('Resposta despesas:', expensesResponse);
    
    // 3. Calcular gastos do dia (somente despesas de hoje)
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = expensesResponse?.data?.filter(expense => 
      expense.createdAt.startsWith(today)
    ) || [];
    
    const totalGastosDia = todayExpenses.reduce((total, expense) => total + expense.value, 0);
    console.log('Gastos do dia:', totalGastosDia);
    
    // 4. Calcular clientes cobrados
    // NOTA: Como não temos endpoint específico para clientes cobrados hoje,
    // usamos uma estimativa baseada no valor arrecadado / valor médio por cliente
    // Idealmente, deveria haver um endpoint como GET /api/payments/collected-today
    const valorMedioPorCliente = 100; // Valor estimado, pode ser ajustado
    const clientesCobrados = Math.floor((scheduleResponse?.data?.collectedToday || 0) / valorMedioPorCliente) || 0;
    console.log('Clientes cobrados (estimativa):', clientesCobrados);
    
    // Tentativa de obter dados mais precisos (se disponível)
    try {
      const clientesPrecisos = await getClientesCobradosHoje();
      if (clientesPrecisos > 0) {
        console.log('Usando dados precisos de clientes cobrados:', clientesPrecisos);
        // Se conseguirmos dados precisos, usamos eles
        // Por enquanto, mantemos a estimativa pois a função retorna 0
      }
    } catch (error) {
      console.log('Mantendo estimativa para clientes cobrados');
    }

    const result = {
      expectativaArrecadacao: scheduleResponse?.data?.dailyExpectation || 0,
      arrecadacaoDia: scheduleResponse?.data?.collectedToday || 0,
      clientesCobrados,
      gastosDia: totalGastosDia
    };
    
    console.log('Dados do fechamento:', result);
    return result;
  } catch (error) {
    console.error('Erro ao buscar dados do fechamento:', error);
    // Retornar valores zerados em caso de erro para não quebrar a UI
    return {
      expectativaArrecadacao: 0,
      arrecadacaoDia: 0,
      clientesCobrados: 0,
      gastosDia: 0
    };
  }
};

// Função auxiliar para buscar clientes cobrados hoje
export const getClientesCobradosHoje = async (): Promise<number> => {
  if (isDev()) {
    // Mock: 3 clientes cobrados hoje
    return 3;
  }

  try {
    // Tentar buscar clientes (pode ser útil para outras funcionalidades)
    const clientsResponse: ClientsResponse = await apiRequest('/api/clients');
    console.log('Clientes disponíveis:', clientsResponse);
    
    // NOTA: Idealmente deveríamos ter um endpoint específico como:
    // GET /api/payments/collected-today que retornasse os pagamentos de hoje
    // ou GET /api/clients/collected-today que retornasse os clientes cobrados hoje
    
    // Por enquanto, vamos manter a estimativa baseada na arrecadação
    // Esta função pode ser melhorada quando tivermos o endpoint correto
    return 0; // Placeholder, pois não temos endpoint específico
  } catch (error) {
    console.error('Erro ao buscar clientes cobrados hoje:', error);
    return 0;
  }
};

export const fecharDia = async () => {
  if (isDev()) {
    return {
      success: true,
      message: 'Dia fechado com sucesso',
      data: null
    };
  }

  return apiRequest('/api/users/close-day', {
    method: 'POST',
    body: JSON.stringify({ toClose: true })
  });
};

export const abrirDia = async () => {
  if (isDev()) {
    return {
      success: true,
      message: 'Dia aberto com sucesso',
      data: null
    };
  }

  return apiRequest('/api/users/open-day', {
    method: 'POST',
    body: JSON.stringify({ toOpen: true })
  });
};

// Funções para MANAGER controlar dia de ROUTE
export const fecharDiaRoute = async (routeId: number) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Dia fechado com sucesso',
      data: null
    };
  }

  return apiRequest(`/api/users/${routeId}/close-day`, {
    method: 'POST',
    body: JSON.stringify({ toClose: true })
  });
};

export const abrirDiaRoute = async (routeId: number) => {
  if (isDev()) {
    return {
      success: true,
      message: 'Dia aberto com sucesso',
      data: null
    };
  }

  return apiRequest(`/api/users/${routeId}/open-day`, {
    method: 'POST',
    body: JSON.stringify({ toOpen: true })
  });
};

export const verificarFechamento = async () => {
  // REMOVIDO: Esta função não é mais necessária
  // O status de fechamento agora vem do login (closedDay) e das respostas das APIs
  if (isDev()) {
    // Mock response - simula que o dia não está fechado
    return {
      diaFechado: false,
      horarioFechamento: null
    };
  }

  // Não faz mais chamada para /api/fechamento/verificar
  // Retorna status baseado no usuário atual
  return {
    diaFechado: false, // Será atualizado pelo contexto de autenticação
    horarioFechamento: null
  };
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
    return data.formatted ? new Date(data.formatted) : new Date();
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
  // REMOVIDO: Não verifica mais endpoint específico
  // O controle de acesso agora é baseado no campo closedDay do login
  // e nas respostas das APIs (data: "closed-day")
  
  if (isDev()) {
    // Em dev, sempre permite acesso
    return true;
  }

  try {
    // O controle agora é feito pelo interceptador de API
    // que verifica respostas com data: "closed-day"
    // e pelo contexto de autenticação que armazena closedDay
    
    // Por enquanto, retorna true - o bloqueio será feito pelo interceptador
    return true;
  } catch (error) {
    // Em caso de erro, permitir acesso para não bloquear o usuário
    console.error('Erro ao verificar acesso:', error);
    return true;
  }
};
