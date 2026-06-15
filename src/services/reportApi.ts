import { apiRequest, isDev } from './api';

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

export const generateSimpleWeeklyReport = async (request: CreateSimpleWeeklyReportRequest): Promise<Report> => {
  if (isDev()) {
    return {
      id: 3,
      title: 'Relatório Semanal Simplificado - 01/06/2024 - 07/06/2024',
      reportType: 'SIMPLE_WEEKLY',
      periodStart: '2024-06-01',
      periodEnd: '2024-06-07',
      routeIds: [1, 2],
      data: {
        simpleDays: [
          {
            date: '03/06/2024',
            dayOfWeek: 'SEGUNDA-FEIRA',
            newCreditsValue: 500,
            newCreditsCount: 2,
            paymentsCount: 15,
            paymentsValue: 1200,
            collectedClientsCount: 10,
            activeCreditsCount: 45,
            creditsWithPayment: 30,
            creditsWithoutPayment: 15,
            totalExpenses: 100,
            deposits: 0,
            withdrawals: 0,
            cashBalance: 600,
            cashAdjustment: 0
          },
          {
            date: '04/06/2024',
            dayOfWeek: 'TERÇA-FEIRA',
            newCreditsValue: 300,
            newCreditsCount: 1,
            paymentsCount: 18,
            paymentsValue: 1400,
            collectedClientsCount: 12,
            activeCreditsCount: 46,
            creditsWithPayment: 32,
            creditsWithoutPayment: 14,
            totalExpenses: 80,
            deposits: 2000,
            withdrawals: 500,
            cashBalance: 2520,
            cashAdjustment: 1500
          }
        ],
        simpleSummary: {
          periodStart: '01/06/2024',
          periodEnd: '07/06/2024',
          totalDays: 5,
          totalPaymentsCount: 78,
          totalPaymentsValue: 5600,
          initialCashBalance: 1200,
          totalCollectedClients: 18,
          averagePaymentsPerDay: 15.6,
          averageCollectionPerDay: 1120
        },
        includedRoutes: ['Rota Centro (joao)', 'Rota Sul (maria)']
      },
      createdAt: '2024-06-07T10:00:00'
    };
  }

  const response = await apiRequest('/api/reports/simple-weekly', {
    method: 'POST',
    body: JSON.stringify(request)
  });
  return response?.data;
};

export const generateWeeklyByRouteReport = async (request: GenerateWeeklyByRouteReportRequest): Promise<Report> => {
  if (isDev()) {
    return {
      id: 2,
      title: 'Relatório Semanal - Rota Centro - 01/06/2024 - 07/06/2024',
      reportType: 'WEEKLY_BY_ROUTE',
      periodStart: '2024-06-01',
      periodEnd: '2024-06-07',
      routeIds: [1],
      data: {
        routeName: 'Rota Centro',
        detailedDays: [
          {
            date: '03/06/2024',
            dayOfWeek: 'segunda-feira',
            credits: [
              { id: 101, clientName: 'João Silva', clientShop: 'Loja A', value: 500 }
            ],
            debits: [
              { id: 201, clientName: 'Maria Souza', clientShop: 'Loja B', value: 100 }
            ],
            expenses: [
              { id: 301, category: 'Alimentação', type: 'Lanche', description: 'Lanche da tarde', value: 30 }
            ],
            transactions: [
              { id: 401, type: 'MANAGER_DEPOSIT', value: 1000, description: 'Depósito inicial' }
            ],
            dailyTotal: {
              totalLent: 500,
              totalCollected: 100,
              totalExpenses: 30,
              totalDeposits: 1000,
              totalWithdrawals: 0,
              balance: 570
            }
          }
        ],
        weeklySummary: {
          totalLent: 500,
          totalCollected: 100,
          totalExpenses: 30,
          totalDeposits: 1000,
          totalWithdrawals: 0,
          finalBalance: 570
        }
      },
      createdAt: '2024-06-07T10:00:00'
    };
  }

  const response = await apiRequest('/api/reports/weekly-by-route', {
    method: 'POST',
    body: JSON.stringify(request)
  });
  return response?.data;
};

export const generateReport = async (request: GenerateReportRequest): Promise<Report> => {
  if (isDev()) {
    // Mock report
    return {
      id: 1,
      title: 'Relatório Geral 01/06 - 07/06',
      reportType: 'WEEKLY_GENERAL',
      periodStart: '2024-06-01',
      periodEnd: '2024-06-07',
      routeIds: [1, 2],
      data: {
        days: [
          {
            date: '2024-06-03',
            dayOfWeek: 'Monday',
            routes: [
              {
                routeId: 1,
                routeName: 'Rota A',
                totalLent: 500,
                totalCollected: 1200,
                totalExpenses: 100,
                totalDeposits: 0,
                totalWithdrawals: 0,
                dailyBalance: 600
              },
              {
                routeId: 2,
                routeName: 'Rota B',
                totalLent: 300,
                totalCollected: 800,
                totalExpenses: 50,
                totalDeposits: 0,
                totalWithdrawals: 0,
                dailyBalance: 450
              }
            ],
            dailyTotal: {
              totalLent: 800,
              totalCollected: 2000,
              totalExpenses: 150,
              totalDeposits: 0,
              totalWithdrawals: 0,
              balance: 1050
            }
          }
        ],
        weeklySummary: {
          totalLent: 800,
          totalCollected: 2000,
          totalExpenses: 150,
          totalDeposits: 0,
          totalWithdrawals: 0,
          finalBalance: 1050
        }
      },
      createdAt: '2024-06-07T10:00:00'
    };
  }

  const response = await apiRequest('/api/reports', {
    method: 'POST',
    body: JSON.stringify(request)
  });
  return response?.data;
};

export const listReports = async (): Promise<Report[]> => {
  if (isDev()) {
    return [
      {
        id: 1,
        title: 'Relatório Geral 01/06 - 07/06',
        reportType: 'WEEKLY_GENERAL',
        periodStart: '2024-06-01',
        periodEnd: '2024-06-07',
        routeIds: [1, 2],
        data: {
          days: [],
          weeklySummary: {
            totalLent: 800,
            totalCollected: 2000,
            totalExpenses: 150,
            totalDeposits: 0,
            totalWithdrawals: 0,
            finalBalance: 1050
          }
        },
        createdAt: '2024-06-07T10:00:00'
      }
    ];
  }

  const response = await apiRequest('/api/reports');
  return response?.data || [];
};

export const getReport = async (id: number): Promise<Report> => {
  if (isDev()) {
    return generateReport({
      reportType: 'WEEKLY_GENERAL',
      periodStart: '2024-06-01',
      periodEnd: '2024-06-07',
      routeIds: [1, 2]
    });
  }

  const response = await apiRequest(`/api/reports/${id}`);
  return response?.data;
};

export const deleteReport = async (id: number): Promise<void> => {
  if (isDev()) {
    return;
  }

  await apiRequest(`/api/reports/${id}`, {
    method: 'DELETE'
  });
};
