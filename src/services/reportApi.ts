import { apiRequest } from './api';

export interface Report {
  id: number;
  title: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  routeIds: number[];
  data: ReportData;
  createdAt: string;
}

export interface ReportData {
  days?: DailySummary[];
  weeklySummary?: WeeklySummary;
  routeName?: string;
  detailedDays?: DetailedDay[];
  simpleDays?: SimpleDay[];
  simpleSummary?: SimpleSummary;
  includedRoutes?: string[];
  dailyRouteSummary?: DailyRouteSummary;
  collectionRows?: CollectionRow[];
  newCreditRows?: NewCreditRow[];
  overdueClients?: OverdueClientRow[];
  weeklyOverdueClients?: OverdueClientRow[];
}

export interface DailySummary {
  date: string;
  dayOfWeek: string;
  routes: RouteSummary[];
  dailyTotal: DailyTotal;
}

export interface RouteSummary {
  routeId: number;
  routeName: string;
  totalLent: number;
  totalCollected: number;
  totalExpenses: number;
  totalDeposits: number;
  totalWithdrawals: number;
  dailyBalance: number;
}

export interface DailyTotal {
  totalLent: number;
  totalCollected: number;
  totalExpenses: number;
  totalDeposits: number;
  totalWithdrawals: number;
  balance: number;
}

export interface WeeklySummary {
  totalLent: number;
  totalCollected: number;
  totalExpenses: number;
  totalDeposits: number;
  totalWithdrawals: number;
  finalBalance: number;
}

export interface DetailedDay {
  date: string;
  dayOfWeek: string;
  credits: CreditItem[];
  debits: DebitItem[];
  expenses: ExpenseItem[];
  transactions: TransactionItem[];
  dailyTotal: DailyTotal;
  overdueClients?: OverdueClientRow[];
}

export interface CreditItem {
  id: number;
  clientName: string;
  clientShop: string;
  value: number;
}

export interface DebitItem {
  id: number;
  clientName: string;
  clientShop: string;
  value: number;
}

export interface ExpenseItem {
  id: number;
  category: string;
  type: string;
  description: string;
  value: number;
}

export interface TransactionItem {
  id: number;
  type: string;
  value: number;
  description: string;
}

export interface SimpleDay {
  date: string;
  dayOfWeek: string;
  newCreditsValue: number;
  newCreditsCount: number;
  paymentsCount: number;
  paymentsValue: number;
  collectedClientsCount: number;
  activeCreditsCount: number;
  creditsWithPayment: number;
  creditsWithoutPayment: number;
  totalExpenses: number;
  deposits: number;
  withdrawals: number;
  cashBalance: number;
  cashAdjustment: number;
}

export interface SimpleSummary {
  periodStart: string;
  periodEnd: string;
  totalDays: number;
  totalPaymentsCount: number;
  totalPaymentsValue: number;
  totalCollectedClients: number;
  initialCashBalance: number;
  averagePaymentsPerDay: number;
  averageCollectionPerDay: number;
}

export interface DailyRouteSummary {
  initialCash: number;
  collectionExpectation: number;
  activeClientsCount: number;
  activeCreditsCount: number;
  creditsWithPayment: number;
  creditsWithoutPayment: number;
  totalCollections: number;
  newCreditsValue: number;
  newCreditsCount: number;
  totalExpenses: number;
  totalDeposits: number;
  totalWithdrawals: number;
  finalCash: number;
}

export interface CollectionRow {
  clientId: number;
  clientName: string;
  creditStartDate: string;
  creditValue: number;
  tax: number;
  quantityDays: number;
  installmentNumber: number;
  debitValue: number;
  remainingBalance: number;
  time: string;
}

export interface NewCreditRow {
  clientId: number;
  clientName: string;
  capital: number;
  tax: number;
  balance: number;
}

export interface OverdueClientRow {
  clientName: string;
  clientShop: string;
  creditId: number;
  initialValue: number;
  tax: number;
  quantityDays: number;
  startDate: string;
  finalDate: string;
  expectedPayment: number;
  amountPaid: number;
  remainingDebt: number;
  overdue: boolean;
}

export interface GenerateReportRequest {
  reportType: 'WEEKLY_GENERAL' | 'SIMPLE_WEEKLY';
  periodStart: string;
  periodEnd: string;
  routeIds: number[] | null;
}

export interface GenerateWeeklyByRouteReportRequest {
  periodStart: string;
  periodEnd: string;
  routeId: number;
}

export interface CreateSimpleWeeklyReportRequest {
  periodStart: string;
  periodEnd: string;
  routeIds: number[];
}

export interface CreateDailyByRouteReportRequest {
  date: string;
  routeId: number;
}

export const generateSimpleWeeklyReport = async (request: CreateSimpleWeeklyReportRequest): Promise<Report> => {
  const response = await apiRequest('/api/reports/simple-weekly', {
    method: 'POST',
    body: JSON.stringify(request)
  });
  if (!response) throw new Error('Erro ao gerar relatório');
  if (response.success === false) throw new Error(response.message || 'Erro ao gerar relatório');
  return response.data;
};

export const generateWeeklyByRouteReport = async (request: GenerateWeeklyByRouteReportRequest): Promise<Report> => {
  const response = await apiRequest('/api/reports/weekly-by-route', {
    method: 'POST',
    body: JSON.stringify(request)
  });
  if (!response) throw new Error('Erro ao gerar relatório');
  if (response.success === false) throw new Error(response.message || 'Erro ao gerar relatório');
  return response.data;
};

export const generateReport = async (request: GenerateReportRequest): Promise<Report> => {
  const response = await apiRequest('/api/reports', {
    method: 'POST',
    body: JSON.stringify(request)
  });
  if (!response) throw new Error('Erro ao gerar relatório');
  if (response.success === false) throw new Error(response.message || 'Erro ao gerar relatório');
  return response.data;
};

export const listReports = async (): Promise<Report[]> => {
  const response = await apiRequest('/api/reports');
  return response?.data || [];
};

export const getReport = async (id: number): Promise<Report> => {
  const response = await apiRequest(`/api/reports/${id}`);
  return response?.data;
};

export interface CreateRouteDailyReportRequest {
  date: string;
}

export interface CreateRouteWeeklyReportRequest {
  periodStart: string;
  periodEnd: string;
}

export const generateRouteDailyReport = async (request: CreateRouteDailyReportRequest): Promise<{ report: Report; message: string }> => {
  const response = await apiRequest('/api/reports/route/daily', {
    method: 'POST',
    body: JSON.stringify(request)
  });
  if (!response) throw new Error('Erro ao gerar relatório');
  if (response.success === false) throw new Error(response.message || 'Erro ao gerar relatório');
  return { report: response.data, message: response.message };
};

export const generateRouteDailyTodayReport = async (): Promise<{ report: Report; message: string }> => {
  const response = await apiRequest('/api/reports/route/daily/today', {
    method: 'POST'
  });
  if (!response) throw new Error('Erro ao gerar relatório');
  if (response.success === false) throw new Error(response.message || 'Erro ao gerar relatório');
  return { report: response.data, message: response.message };
};

export const generateRouteWeeklyReport = async (request: CreateRouteWeeklyReportRequest): Promise<{ report: Report; message: string }> => {
  const response = await apiRequest('/api/reports/route/weekly', {
    method: 'POST',
    body: JSON.stringify(request)
  });
  if (!response) throw new Error('Erro ao gerar relatório');
  if (response.success === false) throw new Error(response.message || 'Erro ao gerar relatório');
  return { report: response.data, message: response.message };
};

export const listRouteReports = async (): Promise<Report[]> => {
  const response = await apiRequest('/api/reports/route');
  return response?.data || [];
};

export const getRouteReport = async (id: number): Promise<Report> => {
  const response = await apiRequest(`/api/reports/route/${id}`);
  return response?.data;
};

export const generateDailyByRouteReport = async (request: CreateDailyByRouteReportRequest): Promise<{ report: Report; message: string }> => {
  const response = await apiRequest('/api/reports/daily-by-route', {
    method: 'POST',
    body: JSON.stringify(request)
  });
  if (!response) throw new Error('Erro ao gerar relatório');
  if (response.success === false) throw new Error(response.message || 'Erro ao gerar relatório');
  return { report: response.data, message: response.message };
};

export const deleteReport = async (id: number): Promise<void> => {
  const response = await apiRequest(`/api/reports/${id}`, {
    method: 'DELETE'
  });
  if (response && response.success === false) throw new Error(response.message || 'Erro ao excluir relatório');
};
