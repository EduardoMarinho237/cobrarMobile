import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonButtons,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonProgressBar
} from '@ionic/react';
import { add, create, trash, card, cardOutline } from 'ionicons/icons';
import {
  Client,
  CreateClientRequest,
  UpdateClientRequest,
  getClients,
  createClient,
  updateClient,
  deleteClient
} from '../../services/clientApi';
import { 
  Credit, 
  CreateCreditRequest, 
  getCredits, 
  createCredit 
} from '../../services/creditApi';
import { getCurrentUser, apiRequest } from '../../services/api';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';

const Clients: React.FC = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showClientCreditsModal, setShowClientCreditsModal] = useState(false);
  const [showCreditViewModal, setShowCreditViewModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

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

  const [newCredit, setNewCredit] = useState<CreateCreditRequest>({
    initialValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    quantityDays: 1,
    clientId: 0
  });

  const [clientCredits, setClientCredits] = useState<Credit[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentTax, setCurrentTax] = useState<number>(0);

  useEffect(() => {
    loadClients();
    loadCurrentUser();
    loadCurrentTax();
  }, []);

  const loadCurrentUser = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
  };

  const loadCurrentTax = async () => {
    try {
      const response = await apiRequest('/api/users/tax', {
        method: 'GET',
      });
      
      if (response && response.data !== undefined) {
        setCurrentTax(response.data);
      } else if (response !== null) {
        setCurrentTax(response);
      } else {
        // Fallback para modo mock ou resposta vazia
        setCurrentTax(0);
      }
    } catch (error) {
      console.error('Erro ao buscar taxa atual:', error);
      // Fallback para taxa do usuário logado ou 0
      setCurrentTax(currentUser?.tax || 0);
    }
  };

  const loadClients = async (event?: CustomEvent) => {
    setIsLoading(true);
    try {
      const data = await getClients();
      setClients(data);
    } catch {
      showToast(t('pages.clients.errorLoadingClients'), 'danger');
    } finally {
      setIsLoading(false);
      if (event) event.detail.complete();
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handleCreateClient = async () => {
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
  };

  const handleEditClient = async () => {
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
  };

  const handleDeleteClient = async () => {
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
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setEditClient({
      name: client.name,
      cpf: client.cpf,
      phone: client.phone,
      address: client.address,
      shop: client.shop
    });
    setShowEditModal(true);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

  const openCreditModal = async (client: Client) => {
    setSelectedClient(client);
    setNewCredit({ 
      initialValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      quantityDays: 1,
      clientId: client.id
    });
    
    // Buscar a taxa atual do sistema
    await loadCurrentTax();
    
    setShowCreditModal(true);
  };

  const handleCreateCredit = async () => {
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
          startDate: new Date().toISOString().split('T')[0],
          quantityDays: 1,
          clientId: 0
        });
        loadClients();
      } else {
        showToast(response.message || t('pages.clients.errorCreatingCredit'), 'danger');
      }
    } catch {
      showToast(t('pages.clients.errorCreatingCredit'), 'danger');
    }
  };

  const openClientCreditsModal = async (client: Client) => {
    setSelectedClient(client);
    try {
      const allCredits = await getCredits();
      const clientCreditsFiltered = allCredits.filter(credit => credit.clientId === client.id);
      setClientCredits(clientCreditsFiltered);
      setShowClientCreditsModal(true);
    } catch {
      showToast(t('pages.clients.errorLoadingClientCredits'), 'danger');
    }
  };

  const openCreditViewModal = (credit: Credit) => {
    setSelectedCredit(credit);
    setShowCreditViewModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const calculateProgress = (credit: Credit) => {
    const totalValue = credit.initialValue + (credit.initialValue * credit.tax / 100);
    const paidValue = totalValue - credit.totalDebt;
    const percentage = totalValue > 0 ? (paidValue / totalValue) * 100 : 0;
    
    return {
      totalValue,
      paidValue,
      percentage: Math.min(Math.max(percentage, 0), 100)
    };
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.clients.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={loadClients}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          <IonButton
            expand="block"
            shape="round"
            onClick={() => setShowCreateModal(true)}
            style={{ marginBottom: '16px' }}
          >
            <IonIcon slot="start" icon={add} />
            {t('pages.clients.addClient')}
          </IonButton>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', marginTop: '16px' }}>
                {t('pages.clients.loadingClients')}
              </p>
            </div>
          ) : clients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('pages.clients.noClientsRegistered')}</p>
            </div>
          ) : (
            clients.map((client) => (
              <IonCard key={client.id} style={{ marginBottom: '16px', borderRadius: '12px' }}>
                <IonCardHeader>
                  <IonCardTitle>{client.name}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.clients.cpf')}: {client.cpf || t('pages.clients.notProvided')}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.clients.phone')}: {client.phone || t('pages.clients.notProvided')}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.clients.shop')}: {client.shop || t('pages.clients.notProvidedFemale')}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.clients.address')}: {client.address || t('pages.clients.notProvided')}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.clients.credits')}: {client.creditsCount}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.clients.debits')}: {client.debitsCount}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>
                              {t('pages.clients.balance')}:{' '}
                              {formatCurrency(client.totalCreditsValue - client.totalDebitsValue)}
                            </h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol size="3">
                        <IonButton fill="clear" onClick={() => openCreditModal(client)}>
                          <IonIcon icon={add} />
                        </IonButton>
                      </IonCol>
                      <IonCol size="3">
                        <IonButton fill="clear" onClick={() => openClientCreditsModal(client)}>
                          <IonIcon icon={card} />
                        </IonButton>
                      </IonCol>
                      <IonCol size="3">
                        <IonButton fill="clear" onClick={() => openEditModal(client)}>
                          <IonIcon icon={create} />
                        </IonButton>
                      </IonCol>
                      <IonCol size="3">
                        <IonButton
                          fill="clear"
                          color="danger"
                          onClick={() => {
                            setSelectedClient(client);
                            setShowDeleteAlert(true);
                          }}
                        >
                          <IonIcon icon={trash} />
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>
      </IonContent>

      <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('pages.clients.addClient')}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowCreateModal(false)}>{t('common.close')}</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: '16px' }}>
            {(['name','cpf','phone','address','shop'] as const).map((field) => (
              <IonItem key={field}>
                <IonInput
                  label={t(`pages.clients.${field}`)}
                  labelPlacement="floating"
                  placeholder={t(`pages.clients.${field}Placeholder`)}
                  value={newClient[field]}
                  onIonInput={(e: any) =>
                    setNewClient({ ...newClient, [field]: e.detail.value! })
                  }
                />
              </IonItem>
            ))}
            <IonButton
              expand="block"
              shape="round"
              onClick={handleCreateClient}
              style={{ marginTop: '16px' }}
            >
              {t('pages.clients.create')}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('pages.clients.editClient')}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowEditModal(false)}>{t('common.close')}</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: '16px' }}>
            {(['name','cpf','phone','address','shop'] as const).map((field) => (
              <IonItem key={field}>
                <IonInput
                  label={t(`pages.clients.${field}`)}
                  labelPlacement="floating"
                  placeholder={t(`pages.clients.${field}Placeholder`)}
                  value={editClient[field]}
                  onIonInput={(e: any) =>
                    setEditClient({ ...editClient, [field]: e.detail.value! })
                  }
                />
              </IonItem>
            ))}
            <IonButton
              expand="block"
              shape="round"
              onClick={handleEditClient}
              style={{ marginTop: '16px' }}
            >
              {t('pages.clients.update')}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header={t('pages.clients.confirmDelete')}
        message={t('pages.clients.confirmDeleteMessage').replace(
          '{clientName}',
          selectedClient?.name || ''
        )}
        buttons={[
          { text: t('common.cancel'), role: 'cancel' },
          { text: t('pages.clients.confirm'), handler: handleDeleteClient }
        ]}
      />

      {/* Modal Adicionar Crédito */}
      <IonModal isOpen={showCreditModal} onDidDismiss={() => setShowCreditModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('pages.clients.addCredit')}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowCreditModal(false)}>{t('common.close')}</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: '16px' }}>
            <IonItem>
              <IonLabel position="stacked">{t('pages.clients.client')}</IonLabel>
              <IonLabel>
                <h2>{selectedClient?.name}</h2>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{t('pages.clients.interestRate')}</IonLabel>
              <IonLabel>
                <h3>{currentTax}%</h3>
                <p style={{ fontSize: '12px', color: '#666' }}>{t('pages.clients.currentSystemTax')}</p>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonInput
                label={t('pages.clients.initialValue')}
                labelPlacement="floating"
                placeholder="0,00"
                type="number"
                value={newCredit.initialValue}
                onIonInput={(e: any) => setNewCredit({ ...newCredit, initialValue: Number(e.detail.value) })}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label={t('pages.clients.startDate')}
                labelPlacement="floating"
                type="date"
                value={newCredit.startDate}
                onIonInput={(e: any) => setNewCredit({ ...newCredit, startDate: e.detail.value })}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label={t('pages.clients.quantityDays')}
                labelPlacement="floating"
                placeholder="1"
                type="number"
                value={newCredit.quantityDays}
                onIonInput={(e: any) => setNewCredit({ ...newCredit, quantityDays: Number(e.detail.value) })}
              />
            </IonItem>
            <IonButton 
              expand="block" 
              shape="round"
              onClick={handleCreateCredit}
              style={{ marginTop: '16px' }}
            >
              {t('pages.clients.create')}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

        {/* Modal Listar Créditos do Cliente */}
        <IonModal isOpen={showClientCreditsModal} onDidDismiss={() => setShowClientCreditsModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.clients.credits')} - {selectedClient?.name}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowClientCreditsModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              {clientCredits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>{t('pages.clients.noCreditsFound')}</p>
                </div>
              ) : (
                clientCredits.map((credit) => {
                  const progress = calculateProgress(credit);
                  return (
                    <IonCard 
                      key={credit.id} 
                      style={{ 
                        marginBottom: '16px',
                        borderRadius: '12px'
                      }}
                      onClick={() => openCreditViewModal(credit)}
                    >
                      <IonCardContent>
                        <IonGrid>
                          {/* Barra de Progresso - agora no topo e mais chamativa */}
                          <IonRow>
                            <IonCol size="12">
                              <div style={{ padding: '8px 0', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{t('pages.clients.paymentProgress')}</span>
                                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: progress.percentage >= 100 ? '#28a745' : '#007bff' }}>
                                    {progress.percentage.toFixed(1)}%
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '14px', color: '#666' }}>
                                    {formatCurrency(progress.paidValue)}
                                  </span>
                                  <span style={{ fontSize: '14px', color: '#666' }}>
                                    {formatCurrency(progress.totalValue - progress.paidValue)}
                                  </span>
                                </div>
                                <IonProgressBar 
                                  value={progress.percentage / 100} 
                                  color={progress.percentage >= 100 ? 'success' : 'primary'}
                                  style={{ height: '12px', borderRadius: '6px' }}
                                />
                              </div>
                            </IonCol>
                          </IonRow>
                          <IonRow>
                            <IonCol size="12">
                              <IonItem>
                                <IonLabel>
                                  <h3>{t('pages.clients.debtStartDate')}: {formatDate(credit.startDate)}</h3>
                                </IonLabel>
                              </IonItem>
                            </IonCol>
                            <IonCol size="12">
                              <IonItem>
                                <IonLabel>
                                  <h3>{t('pages.clients.loanAmount')}: {formatCurrency(credit.initialValue)}</h3>
                                </IonLabel>
                              </IonItem>
                            </IonCol>
                            <IonCol size="12">
                              <IonItem>
                                <IonLabel>
                                  <h3>{t('pages.clients.totalCredit')}: {formatCurrency(progress.totalValue)}</h3>
                                </IonLabel>
                              </IonItem>
                            </IonCol>
                            <IonCol size="12">
                              <IonItem>
                                <IonLabel>
                                  <h3>{t('pages.clients.totalAmount')}: {formatCurrency(credit.totalDebt)}</h3>
                                </IonLabel>
                              </IonItem>
                            </IonCol>
                          </IonRow>
                        </IonGrid>
                      </IonCardContent>
                    </IonCard>
                  )
                })
              )}
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Visualizar Crédito Detalhado */}
        <IonModal isOpen={showCreditViewModal} onDidDismiss={() => setShowCreditViewModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.clients.creditDetails')} #{selectedCredit?.id}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreditViewModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedCredit && (
              <div style={{ padding: '16px' }}>
                <IonCard style={{ borderRadius: '12px' }}>
                  <IonCardHeader>
                    <IonCardTitle>{t('pages.clients.credit')} #{selectedCredit.id}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.debtStartDate')}: {formatDate(selectedCredit.startDate)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.loanAmount')}: {formatCurrency(selectedCredit.initialValue)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.totalCredit')}: {formatCurrency(selectedCredit.initialValue + (selectedCredit.initialValue * selectedCredit.tax / 100))}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.totalAmount')}: {formatCurrency(selectedCredit.totalDebt)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.interestRate')}: {selectedCredit.tax}%</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.dailyValue')}: {formatCurrency(selectedCredit.dayValue)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.startDate')}: {formatDate(selectedCredit.startDate)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.endDate')}: {formatDate(selectedCredit.finalDate)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.days')}: {selectedCredit.quantityDays}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </IonContent>
        </IonModal>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        color={toast.color}
        onDidDismiss={() => setToast({ ...toast, isOpen: false })}
      />
    </IonPage>
  );
};

export default Clients;