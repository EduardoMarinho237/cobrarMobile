import { apiRequest } from './api';

export interface Transaction {
  id: number;
  tenantId: number;
  transactionId: string;
  transactionType: string;
  description: string;
  routeId: number;
  routeName: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  performedById: number;
  performedByLogin: string;
  performedByName: string;
  performedByRole: string;
  createdAt: string;
  creditClientName?: string;
  expenseCategory?: string;
  expenseType?: string;
}

export interface TransactionPage {
  content: Transaction[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

interface TransactionsParams {
  tenantId?: number | null;
  routeId?: number | null;
  type?: string | null;
  page?: number;
  size?: number;
  date?: string;
}

export const getAdminTransactions = async (params: TransactionsParams): Promise<TransactionPage | null> => {
  const queryParams = new URLSearchParams();
  if (params.tenantId != null) queryParams.append('tenantId', String(params.tenantId));
  if (params.routeId != null) queryParams.append('routeId', String(params.routeId));
  if (params.type != null) queryParams.append('type', params.type);
  if (params.date != null) queryParams.append('date', params.date);
  queryParams.append('page', String(params.page ?? 0));
  queryParams.append('size', String(params.size ?? 50));

  const response = await apiRequest(`/api/admin/financial-transactions?${queryParams.toString()}`, {
    method: 'GET',
  });

  if (!response) return null;

  const apiResponse = response as any;
  if (apiResponse.success === false) return null;
  if (apiResponse.data) {
    return apiResponse.data as TransactionPage;
  }
  return apiResponse as TransactionPage;
};

export const getManagerTransactions = async (params: TransactionsParams): Promise<TransactionPage | null> => {
  const queryParams = new URLSearchParams();
  if (params.routeId != null) queryParams.append('routeId', String(params.routeId));
  if (params.type != null) queryParams.append('type', params.type);
  queryParams.append('page', String(params.page ?? 0));
  queryParams.append('size', String(params.size ?? 50));

  const response = await apiRequest(`/api/manager/financial-transactions?${queryParams.toString()}`, {
    method: 'GET',
  });

  if (!response) return null;

  const apiResponse = response as any;
  if (apiResponse.success === false) return null;
  if (apiResponse.data) {
    return apiResponse.data as TransactionPage;
  }
  return apiResponse as TransactionPage;
};
