import { apiRequest, isDev } from './api';

export interface Client {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  address: string;
  shop: string;
  visible: boolean;
  userId: number;
  creditsCount: number;
  paidCreditsCount: number;
  totalCreditsValue: number;
  debitsCount: number;
  totalDebitsValue: number;
}

export interface CreateClientRequest {
  name: string;
  cpf?: string;
  phone?: string;
  address?: string;
  shop?: string;
}

export interface UpdateClientRequest {
  name: string;
  cpf: string;
  phone?: string;
  address?: string;
  shop?: string;
}

export interface ClientResponse {
  success: boolean;
  message: string;
  data: Client | Client[] | null;
}

const mockClients: Client[] = [
  {
    id: 1,
    name: "João Silva",
    cpf: "123.456.789-00",
    phone: "11999999999",
    address: "Rua A, 123, Bairro Centro, São Paulo - SP",
    shop: "Loja A",
    visible: true,
    userId: 123,
    creditsCount: 2,
    paidCreditsCount: 1,
    totalCreditsValue: 1000,
    debitsCount: 1,
    totalDebitsValue: 500
  },
  {
    id: 2,
    name: "Maria Santos",
    cpf: "987.654.321-00",
    phone: "11888888888",
    address: "Rua B, 456, Bairro Sul, São Paulo - SP",
    shop: "Loja B",
    visible: true,
    userId: 123,
    creditsCount: 1,
    paidCreditsCount: 0,
    totalCreditsValue: 500,
    debitsCount: 0,
    totalDebitsValue: 0
  }
];

export const getClients = async (): Promise<Client[]> => {
  if (isDev()) {
    return mockClients;
  }

  const response: ClientResponse = await apiRequest('/api/clients');
  return Array.isArray(response?.data) ? response.data : [];
};

export const getClientsPaginated = async (page: number, size: number): Promise<{ content: Client[]; last: boolean; totalElements: number }> => {
  if (isDev()) {
    return {
      content: mockClients,
      last: true,
      totalElements: mockClients.length,
    };
  }

  try {
    const response = await apiRequest(`/api/clients/paged?page=${page}&size=${size}`);
    const pageData = response.data;
    return {
      content: pageData.content || [],
      last: pageData.last || false,
      totalElements: pageData.totalElements || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar clientes paginados:', error);
    return { content: mockClients, last: true, totalElements: mockClients.length };
  }
};

export const getClientById = async (id: number): Promise<Client | null> => {
  if (isDev()) {
    // Mock response
    const mockClients = await getClients();
    return mockClients.find(client => client.id === id) || null;
  }

  const response: ClientResponse = await apiRequest(`/api/clients/${id}`);
  return response?.data as Client || null;
};

export const createClient = async (clientData: CreateClientRequest): Promise<ClientResponse> => {
  if (isDev()) {
    // Mock response
    const newClient: Client = {
      id: Date.now(), // ID simulado
      ...clientData,
      cpf: clientData.cpf || '',
      phone: clientData.phone || '',
      address: clientData.address || '',
      shop: clientData.shop || '',
      visible: true,
      userId: 123,
      creditsCount: 0,
      paidCreditsCount: 0,
      totalCreditsValue: 0,
      debitsCount: 0,
      totalDebitsValue: 0
    };

    return {
      success: true,
      message: 'Cliente criado com sucesso',
      data: newClient
    };
  }

  return apiRequest('/api/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
};

export const updateClient = async (id: number, clientData: UpdateClientRequest): Promise<ClientResponse> => {
  if (isDev()) {
    // Mock response
    const updatedClient: Client = {
      id,
      ...clientData,
      phone: clientData.phone || '',
      address: clientData.address || '',
      shop: clientData.shop || '',
      visible: true,
      userId: 123,
      creditsCount: 2,
      paidCreditsCount: 1,
      totalCreditsValue: 1000,
      debitsCount: 1,
      totalDebitsValue: 500
    };

    return {
      success: true,
      message: 'Cliente atualizado com sucesso',
      data: updatedClient
    };
  }

  return apiRequest(`/api/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(clientData),
  });
};

export const deleteClient = async (id: number): Promise<ClientResponse> => {
  if (isDev()) {
    // Mock response
    return {
      success: true,
      message: 'Cliente excluído com sucesso',
      data: null
    };
  }

  return apiRequest(`/api/clients/${id}`, {
    method: 'DELETE',
  });
};
