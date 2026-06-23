import { apiRequest } from './api';
import i18n from '../i18n';

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
      message: i18n.t('common.connectionError')
    };
  }
};

export const getDashboards = async () => {
  // Para endpoints GET, retorna a resposta diretamente
  return apiRequest('/api/dashboard');
};

export const getDashboardById = async (id: number) => {
  // Para endpoints GET, retorna a resposta diretamente
  return apiRequest(`/api/dashboard/${id}`);
};

// Importar getRoutes para o filtro de rotas
import { getRoutes } from './routeApi';
