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
  weeklySummary: WeeklySummary;
  routeName?: string;
  detailedDays?: DetailedDay[];
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

export interface GenerateReportRequest {
  reportType: 'WEEKLY_GENERAL';
  periodStart: string;
  periodEnd: string;
  routeIds: number[] | null;
}

export interface GenerateWeeklyByRouteReportRequest {
  periodStart: string;
  periodEnd: string;
  routeId: number;
}

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
