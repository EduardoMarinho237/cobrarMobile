import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  getClientsPaginated,
  createClient,
  updateClient,
  deleteClient
} from '../../../../services/clientApi';
import {
  Credit,
  CreateCreditRequest,
  getCredits,
  createCredit,
  getTodayTotalInitialValue
} from '../../../../services/creditApi';
import { getCurrentUser, apiRequest } from '../../../../services/api';
import { todayFormatted, nextBusinessDayFormatted, isSunday } from '../../../../utils/sundayUtil';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import { useInView } from 'react-intersection-observer';

interface ToastState {
  isOpen: boolean;
  message: string;
  color: string;
}

interface ProgressResult {
  totalValue: number;
  paidValue: number;
  percentage: number;
}

export const useClients = () => {
  const { t } = useTranslation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showClientCreditsModal, setShowClientCreditsModal] = useState(false);
  const [showCreditViewModal, setShowCreditViewModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [toast, setToast] = useState<ToastState>({ isOpen: false, message: '', color: '' });

  const {
    items: clients,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteScroll<Client>({
    fetchPage: async (page, size) => {
      const response = await getClientsPaginated(page, size);
      return {
        content: response.content,
        last: response.last,
        totalElements: response.totalElements,
      };
    },
    pageSize: 20,
  });

  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasMore && !isLoading && !isLoadingMore) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, isLoadingMore, loadMore]);

  const [newClient, setNewClient] = useState<CreateClientRequest>({
    name: '',
    cpf: '',
    phone: '',
    address: '',
    shop: ''
  });

  const [editClient, setEditClient] = useState<UpdateClientRequest>({
    name: '',
    cpf: '',
    phone: '',
    address: '',
    shop: ''
  });

  const defaultStartDate = isSunday(new Date()) ? nextBusinessDayFormatted() : todayFormatted();

  const [newCredit, setNewCredit] = useState<CreateCreditRequest>({
    initialValue: 0,
    startDate: defaultStartDate,
    quantityDays: 1,
    clientId: 0,
    overdue: 'EXTEND_TERM'
  });

  const [clientCredits, setClientCredits] = useState<Credit[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentTax, setCurrentTax] = useState<number>(0);
  const [todayTotal, setTodayTotal] = useState<number>(0);

  useEffect(() => {
    loadCurrentUser();
    loadCurrentTax();
    loadTodayTotal();
  }, []);

  const loadTodayTotal = useCallback(async () => {
    try {
      const total = await getTodayTotalInitialValue();
      setTodayTotal(total);
    } catch (error) {
      console.error('Erro ao carregar total de créditos de hoje:', error);
    }
  }, []);

  const showToast = useCallback((message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  }, []);

  const loadCurrentUser = useCallback(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const loadCurrentTax = useCallback(async () => {
    try {
      const response = await apiRequest('/api/users/tax', { method: 'GET' });
      if (response && response.data !== undefined) {
        setCurrentTax(response.data);
      } else if (response !== null) {
        setCurrentTax(response);
      } else {
        setCurrentTax(0);
      }
    } catch (error) {
      console.error('Erro ao buscar taxa atual:', error);
      setCurrentTax(currentUser?.tax || 0);
    }
  }, [currentUser]);

  const loadClients = useCallback(async (event?: CustomEvent) => {
    await refresh();
    if (event) event.detail.complete();
  }, [refresh]);

  const handleCreateClient = useCallback(async () => {
    if (!newClient.name.trim()) {
      showToast(t('pages.clients.nameRequired'), 'danger');
      return;
    }

    try {
      const response = await createClient(newClient);
      if (response.success) {
        showToast(t('pages.clients.clientCreatedSuccess'), 'success');
        setShowCreateModal(false);
        setNewClient({ name: '', cpf: '', phone: '', address: '', shop: '' });
        loadClients();
      } else {
        showToast(response.message || t('pages.clients.errorCreatingClient'), 'danger');
      }
    } catch {
      showToast(t('pages.clients.errorCreatingClient'), 'danger');
    }
  }, [newClient, t, showToast, loadClients]);

  const handleEditClient = useCallback(async () => {
    if (!editClient.name.trim()) {
      showToast(t('pages.clients.nameRequired'), 'danger');
      return;
    }

    if (!selectedClient) return;

    try {
      const response = await updateClient(selectedClient.id, editClient);
      if (response.success) {
        showToast(t('pages.clients.clientUpdatedSuccess'), 'success');
        setShowEditModal(false);
        setEditClient({ name: '', cpf: '', phone: '', address: '', shop: '' });
        setSelectedClient(null);
        loadClients();
      } else {
        showToast(response.message || t('pages.clients.errorUpdatingClient'), 'danger');
      }
    } catch {
      showToast(t('pages.clients.errorUpdatingClient'), 'danger');
    }
  }, [editClient, selectedClient, t, showToast, loadClients]);

  const handleDeleteClient = useCallback(async () => {
    if (!selectedClient) return;

    try {
      const response = await deleteClient(selectedClient.id);
      showToast(
        response.message || t('pages.clients.clientDeletedSuccess'),
        response.success ? 'success' : 'danger'
      );

      if (response.success) {
        setShowDeleteAlert(false);
        setSelectedClient(null);
        loadClients();
      }
    } catch {
      showToast(t('pages.clients.connectionError'), 'danger');
    }
  }, [selectedClient, t, showToast, loadClients]);

  const openEditModal = useCallback((client: Client) => {
    setSelectedClient(client);
    setEditClient({
      name: client.name,
      cpf: client.cpf,
      phone: client.phone,
      address: client.address,
      shop: client.shop
    });
    setShowEditModal(true);
  }, []);

  const openCreditModal = useCallback(async (client: Client) => {
    setSelectedClient(client);
    setNewCredit({
      initialValue: 0,
      startDate: isSunday(new Date()) ? nextBusinessDayFormatted() : todayFormatted(),
      quantityDays: 1,
      clientId: client.id,
      overdue: 'EXTEND_TERM'
    });
    await loadCurrentTax();
    setShowCreditModal(true);
  }, [loadCurrentTax]);

  const handleCreateCredit = useCallback(async () => {
    if (!newCredit.clientId) {
      showToast(t('pages.clients.clientRequired'), 'danger');
      return;
    }

    if (newCredit.initialValue < 1) {
      showToast(t('pages.clients.initialValueRequired'), 'danger');
      return;
    }

    if (newCredit.quantityDays < 1) {
      showToast(t('pages.clients.quantityDaysRequired'), 'danger');
      return;
    }

    try {
      const response = await createCredit(newCredit);
      if (response.success) {
        showToast(t('pages.clients.creditCreatedSuccess'), 'success');
        setShowCreditModal(false);
        setNewCredit({
          initialValue: 0,
          startDate: isSunday(new Date()) ? nextBusinessDayFormatted() : todayFormatted(),
          quantityDays: 1,
          clientId: 0,
          overdue: 'EXTEND_TERM'
        });
        loadClients();
        loadTodayTotal();
      } else {
        showToast(response.message || t('pages.clients.errorCreatingCredit'), 'danger');
      }
    } catch {
      showToast(t('pages.clients.errorCreatingCredit'), 'danger');
    }
  }, [newCredit, t, showToast, loadClients, loadTodayTotal]);

  const openClientCreditsModal = useCallback(async (client: Client) => {
    setSelectedClient(client);
    try {
      const allCredits = await getCredits();
      const clientCreditsFiltered = allCredits.filter(credit => credit.clientId === client.id);
      setClientCredits(clientCreditsFiltered);
      setShowClientCreditsModal(true);
    } catch {
      showToast(t('pages.clients.errorLoadingClientCredits'), 'danger');
    }
  }, [showToast, t]);

  const openCreditViewModal = useCallback((credit: Credit) => {
    setSelectedCredit(credit);
    setShowCreditViewModal(true);
  }, []);

  const formatCurrency = useCallback((value: number) => {
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    return `$ ${formattedValue}`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  }, []);

  const calculateProgress = useCallback((credit: Credit): ProgressResult => {
    const totalValue = credit.initialValue + (credit.initialValue * credit.tax / 100);
    const paidValue = totalValue - credit.totalDebt;
    const percentage = totalValue > 0 ? (paidValue / totalValue) * 100 : 0;

    return {
      totalValue,
      paidValue,
      percentage: Math.min(Math.max(percentage, 0), 100)
    };
  }, []);

  return {
    clients,
    isLoading,
    isLoadingMore,
    hasMore,
    sentinelRef,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    showDeleteAlert,
    setShowDeleteAlert,
    showCreditModal,
    setShowCreditModal,
    showClientCreditsModal,
    setShowClientCreditsModal,
    showCreditViewModal,
    setShowCreditViewModal,
    selectedClient,
    setSelectedClient,
    selectedCredit,
    setSelectedCredit,
    toast,
    setToast,
    newClient,
    setNewClient,
    editClient,
    setEditClient,
    newCredit,
    setNewCredit,
    clientCredits,
    currentTax,
    todayTotal,
    loadClients,
    loadTodayTotal,
    handleCreateClient,
    handleEditClient,
    handleDeleteClient,
    openEditModal,
    openCreditModal,
    handleCreateCredit,
    openClientCreditsModal,
    openCreditViewModal,
    formatCurrency,
    formatDate,
    calculateProgress
  };
};
