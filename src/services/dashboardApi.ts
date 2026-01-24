import { apiRequest, isDev } from './api';

export interface DashboardData {
  id: number;
  dashboardType: 'TOTAL' | 'EXPENSES' | 'CLIENTS' | 'CREDITS_DEBITS' | 'CATEGORIES' | 'TYPES';
  generatedAt: string;
  timePeriod: 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_60_DAYS' | 'LAST_90_DAYS' | 'ALL_TIME';
  dateFrom?: string;
  dateTo?: string;
  routeFilter: number[] | null;
  detail: boolean;
  totalCollected: number;
  totalExpenses: number;
  totalBalance: number;
  totalClients: number;
  totalDebtors: number;
  totalDebtAmount: number;
  totalEfficiency: number;
  expectedCollection: number;
  averageDailyCollection: number;
  collectionRatio: number;
  expenseRatio: number;
  dailyVariance: number;
  activeDays: number;
  daysWithoutCollection: number;
  overdueDebts: number;
  paymentDelayDays: number;
  routesData: string;
  categoriesData: string;
  typesData: string;
  clientsData: string;
  creditsDebitsData: string;
  dailyData: string;
  monthlyData: string;
  yearlyData: string;
}

export interface DashboardRequest {
  dashboardType?: 'TOTAL' | 'EXPENSES' | 'CLIENTS' | 'CREDITS_DEBITS' | 'CATEGORIES' | 'TYPES';
  timePeriod?: 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_60_DAYS' | 'LAST_90_DAYS' | 'ALL_TIME';
  dateFrom?: string;
  dateTo?: string;
  routeIds?: number[];
  detail?: boolean;
}

export interface Route {
  id: number;
  name: string;
  login: string;
  role: string;
  lastAccess?: string;
  restricted?: boolean;
}

export const generateDashboard = async (request: DashboardRequest) => {
  if (isDev()) {
    // Mock response
    return {
      success: true,
      message: 'Dashboard gerado com sucesso',
      data: {
        id: 1,
        dashboardType: request.dashboardType || 'TOTAL',
        generatedAt: new Date().toISOString(),
        timePeriod: request.timePeriod || 'LAST_30_DAYS',
        dateFrom: request.dateFrom || '2024-01-01T00:00:00',
        dateTo: request.dateTo || '2024-01-31T23:59:59',
        routeFilter: request.routeIds || null,
        detail: request.detail || false,
        totalCollected: 15000.00,
        totalExpenses: 3500.00,
        totalBalance: 11500.00,
        totalClients: 120,
        totalDebtors: 45,
        totalDebtAmount: 8000.00,
        totalEfficiency: 87.5,
        expectedCollection: 17250.00,
        averageDailyCollection: 500.00,
        collectionRatio: 87.0,
        expenseRatio: 23.3,
        dailyVariance: 125.50,
        activeDays: 30,
        daysWithoutCollection: 0,
        overdueDebts: 1200.00,
        paymentDelayDays: 15,
        routesData: JSON.stringify([
          {
            routeId: 1,
            routeName: 'Rota A',
            collected: 8000.00,
            expenses: 2000.00,
            clientsCount: 60,
            debtorsCount: 20,
            debtAmount: 4000.00,
            balance: 6000.00
          }
        ]),
        categoriesData: JSON.stringify([
          {
            routeId: 1,
            routeName: 'Rota A',
            categoryId: 1,
            categoryName: 'Combustível',
            totalExpenses: 1500.00,
            expenseCount: 15
          }
        ]),
        typesData: JSON.stringify([
          {
            routeId: 1,
            routeName: 'Rota A',
            typeId: 1,
            typeName: 'Viagem',
            categoryId: 1,
            categoryName: 'Combustível',
            totalExpenses: 1500.00,
            expenseCount: 15
          }
        ]),
        clientsData: JSON.stringify([
          {
            routeId: 1,
            routeName: 'Rota A',
            clientId: 1,
            clientName: 'João Silva',
            cpf: '12345678901',
            phone: '11999999999',
            collectedAmount: 500.00,
            debitCount: 2,
            totalDebt: 1000.00,
            remainingDebt: 500.00
          }
        ]),
        creditsDebitsData: JSON.stringify([
          {
            routeId: 1,
            routeName: 'Rota A',
            creditId: 1,
            creditValue: 1000.00,
            startDate: '2024-01-01T00:00:00',
            tax: 10.00,
            days: 30,
            clientId: 1,
            clientName: 'João Silva',
            debitsTotal: 500.00,
            debitsCount: 2,
            remainingDebt: 500.00
          }
        ]),
        dailyData: JSON.stringify([
          {
            collectionDate: '2024-01-15T00:00:00',
            routeId: 1,
            routeName: 'Rota A',
            dailyCollected: 500.00,
            debitCount: 5,
            dailyExpenses: 50.00,
            balance: 450.00
          }
        ]),
        monthlyData: '[]',
        yearlyData: '[]'
      }
    };
  }

  try {
    const response = await apiRequest('/api/dashboard', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    
    // Se a resposta for null (vazia), considera sucesso
    if (response === null) {
      return {
        success: true,
        message: 'Dashboard gerado com sucesso'
      };
    }
    
    // Se a resposta já tiver success e message, retorna como está
    if (response && typeof response === 'object' && 'success' in response && 'message' in response) {
      return response;
    }
    
    // Senão, formata resposta de sucesso
    return {
      success: true,
      message: 'Dashboard gerado com sucesso',
      data: response
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro de conexão, tente novamente'
    };
  }
};

export const getDashboards = async () => {
  if (isDev()) {
    // Mock response
    return [
      {
        id: 1,
        dashboardType: 'TOTAL',
        generatedAt: new Date().toISOString(),
        timePeriod: 'LAST_30_DAYS',
        dateFrom: '2024-01-01T00:00:00',
        dateTo: '2024-01-31T23:59:59',
        routeFilter: null,
        detail: false,
        totalCollected: 15000.00,
        totalExpenses: 3500.00,
        totalBalance: 11500.00,
        totalClients: 120,
        totalDebtors: 45,
        totalDebtAmount: 8000.00,
        totalEfficiency: 87.5,
        expectedCollection: 17250.00,
        averageDailyCollection: 500.00,
        collectionRatio: 87.0,
        expenseRatio: 23.3,
        dailyVariance: 125.50,
        activeDays: 30,
        daysWithoutCollection: 0,
        overdueDebts: 1200.00,
        paymentDelayDays: 15,
        routesData: '[]',
        categoriesData: '[]',
        typesData: '[]',
        clientsData: '[]',
        creditsDebitsData: '[]',
        dailyData: '[]',
        monthlyData: '[]',
        yearlyData: '[]'
      }
    ];
  }

  // Para endpoints GET, retorna a resposta diretamente
  return apiRequest('/api/dashboard');
};

export const getDashboardById = async (id: number) => {
  if (isDev()) {
    // Mock response
    return {
      id: id,
      dashboardType: 'TOTAL',
      generatedAt: new Date().toISOString(),
      timePeriod: 'LAST_30_DAYS',
      dateFrom: '2024-01-01T00:00:00',
      dateTo: '2024-01-31T23:59:59',
      routeFilter: null,
      detail: false,
      totalCollected: 15000.00,
      totalExpenses: 3500.00,
      totalBalance: 11500.00,
      totalClients: 120,
      totalDebtors: 45,
      totalDebtAmount: 8000.00,
      totalEfficiency: 87.5,
      expectedCollection: 17250.00,
      averageDailyCollection: 500.00,
      collectionRatio: 87.0,
      expenseRatio: 23.3,
      dailyVariance: 125.50,
      activeDays: 30,
      daysWithoutCollection: 0,
      overdueDebts: 1200.00,
      paymentDelayDays: 15,
      routesData: '[]',
      categoriesData: '[]',
      typesData: '[]',
      clientsData: '[]',
      creditsDebitsData: '[]',
      dailyData: '[]',
      monthlyData: '[]',
      yearlyData: '[]'
    };
  }

  // Para endpoints GET, retorna a resposta diretamente
  return apiRequest(`/api/dashboard/${id}`);
};

// Importar getRoutes para o filtro de rotas
import { getRoutes } from './routeApi';
