import { apiRequest } from './api';

export interface ApiKey {
  id: number;
  maskedKey: string;
  description: string;
  active: boolean;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

export interface GenerateApiKeyRequest {
  description: string;
}

export const getApiKeys = async (): Promise<ApiKey[]> => {
  try {
    const response = await apiRequest('/api/admin/api-keys', {
      method: 'GET',
    });

    if (response && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar API keys:', error);
    return [];
  }
};

export const generateApiKey = async (description: string): Promise<{ success: boolean; message: string; data?: { apiKey: string; key: ApiKey } }> => {
  try {
    const response = await apiRequest('/api/admin/api-keys/generate', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });

    if (response && response.data) {
      return {
        success: true,
        message: response.message || 'API key gerada com sucesso',
        data: response.data,
      };
    }

    return {
      success: false,
      message: response?.message || 'Erro ao gerar API key',
    };
  } catch (error: any) {
    console.error('Erro ao gerar API key:', error);
    return {
      success: false,
      message: error.message || 'Erro ao gerar API key',
    };
  }
};

export const revokeApiKey = async (id: number): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiRequest(`/api/admin/api-keys/${id}`, {
      method: 'DELETE',
    });

    return {
      success: response?.success === true,
      message: response?.message || 'API key revogada com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao revogar API key:', error);
    return {
      success: false,
      message: error.message || 'Erro ao revogar API key',
    };
  }
};
