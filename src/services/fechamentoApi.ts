import { apiRequest, isDev } from './api';
import { getMyInitialBalance, getMyManagerTransactions } from './cashBoxApi';

export interface FechamentoData {
  expectativaArrecadacao: number;
  arrecadacaoDia: number;
  clientesCobrados: number;
  gastosDia: number;
  caixaInicial: number;
  totalEmprestado: number;
  emprestimosHoje: Array<{ clientName: string; initialValue: number; totalDebt: number }>;
  depositosRetiradas: Array<{ type: string; amount: number; description: string | null; createdAt: string }>;
  totalDepositos: number;
  totalRetiradas: number;
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
    clientsPaid: number;
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
      gastosDia: 80,
      caixaInicial: 10000,
      totalEmprestado: 200,
      emprestimosHoje: [
        { clientName: 'Cliente 1', initialValue: 100, totalDebt: 120 },
        { clientName: 'Cliente 2', initialValue: 100, totalDebt: 120 }
      ],
      depositosRetiradas: [
        { type: 'MANAGER_DEPOSIT', amount: 5000, description: 'Deposito do manager', createdAt: '2024-01-01T10:00:00' }
      ],
      totalDepositos: 5000,
      totalRetiradas: 0
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
    
    // 4. Obter clientes cobrados (clientes distintos que pagaram hoje)
    const clientesCobrados = scheduleResponse?.data?.clientsPaid || 0;
    console.log('Clientes cobrados (API):', clientesCobrados);

    // 5. Buscar saldo inicial do dia
    const caixaInicial = await getMyInitialBalance();
    console.log('Caixa inicial do dia:', caixaInicial);

    // 6. Buscar créditos de hoje
    const todayCreditsResponse = await apiRequest('/api/credits/today');
    const emprestimosHoje = todayCreditsResponse?.data || [];
    const totalEmprestado = emprestimosHoje.reduce((sum: number, c: any) => sum + (c.initialValue || 0), 0);
    console.log('Empréstimos de hoje:', emprestimosHoje);
    console.log('Total emprestado:', totalEmprestado);

    // 7. Buscar depósitos/retiradas do manager
    const managerTransactions = await getMyManagerTransactions();
    const depositosRetiradas = managerTransactions.map((t: any) => ({
      type: t.type,
      amount: t.amount,
      description: t.description,
      createdAt: t.createdAt
    }));
    const totalDepositos = depositosRetiradas
      .filter((t: any) => t.type === 'MANAGER_DEPOSIT')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const totalRetiradas = depositosRetiradas
      .filter((t: any) => t.type === 'MANAGER_WITHDRAWAL')
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);
    console.log('Depósitos/Retiradas:', depositosRetiradas);
    console.log('Total depósitos:', totalDepositos);
    console.log('Total retiradas:', totalRetiradas);

    const result = {
      expectativaArrecadacao: scheduleResponse?.data?.dailyExpectation || 0,
      arrecadacaoDia: scheduleResponse?.data?.collectedToday || 0,
      clientesCobrados,
      gastosDia: totalGastosDia,
      caixaInicial,
      totalEmprestado,
      emprestimosHoje,
      depositosRetiradas,
      totalDepositos,
      totalRetiradas
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
      gastosDia: 0,
      caixaInicial: 0,
      totalEmprestado: 0,
      emprestimosHoje: [],
      depositosRetiradas: [],
      totalDepositos: 0,
      totalRetiradas: 0
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
