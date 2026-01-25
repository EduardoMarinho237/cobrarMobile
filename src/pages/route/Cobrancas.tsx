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
  IonItem,
  IonLabel,
  IonButton,
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
  IonInput,
  IonCheckbox,
  IonText
} from '@ionic/react';
import { create, refresh, cashOutline, personOutline, locationOutline, callOutline } from 'ionicons/icons';
import { 
  getDailySchedule, 
  createDebit, 
  PendingPayment, 
  DailySchedule, 
  CreateDebitRequest 
} from '../../services/debitApi';
import { getClientById, Client } from '../../services/clientApi';
import Toast from '../../components/Toast';

const Cobrancas: React.FC = () => {
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | null>(null);
  const [clients, setClients] = useState<{ [key: number]: Client }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [editedValue, setEditedValue] = useState<number>(0);
  const [changeAllDays, setChangeAllDays] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const scheduleData = await getDailySchedule();
      setDailySchedule(scheduleData);

      // Carregar informações dos clientes
      const clientPromises = scheduleData.pendingPayments.map(async (payment) => {
        const client = await getClientById(payment.clientId);
        return { clientId: payment.clientId, client };
      });

      const clientResults = await Promise.all(clientPromises);
      const clientMap: { [key: number]: Client } = {};
      
      clientResults.forEach(({ clientId, client }) => {
        if (client) {
          clientMap[clientId] = client;
        }
      });

      setClients(clientMap);
    } catch (error: any) {
      console.error('Erro ao carregar agenda diária:', error);
      showToast(error.message || 'Erro ao carregar agenda diária', 'danger');
      setDailySchedule({
        pendingPayments: [],
        dailyExpectation: 0,
        collectedToday: 0,
        remainingToCollect: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handlePayment = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setEditedValue(payment.installmentValue);
    setChangeAllDays(false);
    setShowPaymentAlert(true);
  };

  const handleEditPayment = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setEditedValue(payment.installmentValue);
    setChangeAllDays(false);
    setShowEditModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedPayment) return;

    const debitRequest: CreateDebitRequest = {
      value: editedValue,
      creditId: selectedPayment.creditId,
      changeAllDays: changeAllDays
    };

    try {
      const response = await createDebit(debitRequest);
      if (response.success) {
        showToast('Pagamento registrado com sucesso', 'success');
        setShowPaymentAlert(false);
        setShowEditModal(false);
        setSelectedPayment(null);
        loadData(); // Recarregar agenda
      } else {
        showToast(response.message || 'Erro ao registrar pagamento', 'danger');
      }
    } catch (error) {
      showToast('Erro ao registrar pagamento', 'danger');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getClientInfo = (clientId: number) => {
    return clients[clientId];
  };

  const openClientModal = async (clientId: number) => {
    const client = await getClientById(clientId);
    if (client) {
      setSelectedClient(client);
      setShowClientModal(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cobranças</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="cobrancas-refresher" onIonRefresh={loadData}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          {/* Cards de Resumo */}
          {dailySchedule && (
            <IonGrid style={{ marginBottom: '20px' }}>
              <IonRow>
                <IonCol size="4">
                  <IonCard style={{ textAlign: 'center', borderRadius: '12px' }}>
                    <IonCardContent>
                      <IonIcon icon={cashOutline} style={{ fontSize: '24px', color: '#007bff' }} />
                      <h4 style={{ margin: '8px 0 4px 0', color: '#007bff' }}>
                        {formatCurrency(dailySchedule.dailyExpectation)}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Meta do Dia</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="4">
                  <IonCard style={{ textAlign: 'center', borderRadius: '12px' }}>
                    <IonCardContent>
                      <IonIcon icon={cashOutline} style={{ fontSize: '24px', color: '#28a745' }} />
                      <h4 style={{ margin: '8px 0 4px 0', color: '#28a745' }}>
                        {formatCurrency(dailySchedule.collectedToday)}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Arrecadado</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="4">
                  <IonCard style={{ textAlign: 'center', borderRadius: '12px' }}>
                    <IonCardContent>
                      <IonIcon icon={cashOutline} style={{ fontSize: '24px', color: '#dc3545' }} />
                      <h4 style={{ margin: '8px 0 4px 0', color: '#dc3545' }}>
                        {formatCurrency(dailySchedule.remainingToCollect)}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Restante</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', marginTop: '16px' }}>Carregando cobranças...</p>
            </div>
          ) : !dailySchedule || dailySchedule.pendingPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Nenhuma cobrança para hoje</p>
            </div>
          ) : (
            dailySchedule.pendingPayments.map((payment) => {
              const clientInfo = getClientInfo(payment.clientId);
              return (
                <IonCard 
                  key={payment.creditId} 
                  style={{ 
                    marginBottom: '16px',
                    borderRadius: '12px'
                  }}
                >
                  <IonCardHeader>
                    <IonCardTitle>{payment.clientName}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        <IonCol size="9">
                          <IonItem button onClick={() => openClientModal(payment.clientId)}>
                            <IonIcon icon={locationOutline} style={{ marginRight: '8px', color: '#666' }} />
                            <IonLabel>
                              <p style={{ color: '#666', fontSize: '14px' }}>
                                {clientInfo?.address || 'Endereço não disponível'}
                              </p>
                            </IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonIcon icon={callOutline} style={{ marginRight: '8px', color: '#666' }} />
                            <IonLabel>
                              <p style={{ color: '#666', fontSize: '14px' }}>
                                {clientInfo?.phone || 'Telefone não disponível'}
                              </p>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ textAlign: 'center' }}>
                            <IonButton
                              color="success"
                              size="small"
                              onClick={() => handlePayment(payment)}
                              style={{ margin: 0 }}
                            >
                              {formatCurrency(payment.installmentValue)}
                            </IonButton>
                            <IonButton
                              fill="clear"
                              size="small"
                              onClick={() => handleEditPayment(payment)}
                              style={{ margin: '4px 0 0 0' }}
                            >
                              <IonIcon icon={create} />
                            </IonButton>
                          </div>
                        </IonCol>
                      </IonRow>
                      {payment.hasOverdueInstallments && (
                        <IonRow style={{ marginTop: '8px' }}>
                          <IonCol size="12">
                            <IonText color="danger">
                              <p style={{ fontSize: '12px', margin: 0 }}>
                                ⚠️ {payment.overdueInstallmentsCount} dias em atraso - {formatCurrency(payment.accumulatedOverdueValue)} acumulado
                              </p>
                            </IonText>
                          </IonCol>
                        </IonRow>
                      )}
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              );
            })
          )}
        </div>

        {/* Modal de Detalhes do Cliente */}
        <IonModal isOpen={showClientModal} onDidDismiss={() => setShowClientModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Informações do Cliente</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowClientModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedClient && (
              <div style={{ padding: '16px' }}>
                <IonItem>
                  <IonIcon icon={personOutline} style={{ marginRight: '12px', color: '#666' }} />
                  <IonLabel>
                    <h3>Nome</h3>
                    <p>{selectedClient.name}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={callOutline} style={{ marginRight: '12px', color: '#666' }} />
                  <IonLabel>
                    <h3>Telefone</h3>
                    <p>{selectedClient.phone || 'Não informado'}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={locationOutline} style={{ marginRight: '12px', color: '#666' }} />
                  <IonLabel>
                    <h3>Endereço</h3>
                    <p>{selectedClient.address || 'Não informado'}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <h3>Loja</h3>
                    <p>{selectedClient.shop || 'Não informada'}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <h3>CPF</h3>
                    <p>{selectedClient.cpf || 'Não informado'}</p>
                  </IonLabel>
                </IonItem>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Modal de Editar Valor */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Editar Valor do Pagamento</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonInput
                  label="Valor do Pagamento"
                  labelPlacement="floating"
                  type="number"
                  value={editedValue}
                  onIonInput={(e: any) => setEditedValue(Number(e.detail.value))}
                />
              </IonItem>
              <IonItem>
                <IonCheckbox
                  checked={changeAllDays}
                  onIonChange={(e) => setChangeAllDays(e.detail.checked)}
                />
                <IonLabel style={{ marginLeft: '16px' }}>
                  Alterar valor para todos os dias restantes
                </IonLabel>
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={() => {
                  setShowEditModal(false);
                  setShowPaymentAlert(true);
                }}
                style={{ marginTop: '16px' }}
              >
                Confirmar Pagamento
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert de Confirmação de Pagamento */}
        <IonAlert
          isOpen={showPaymentAlert}
          onDidDismiss={() => setShowPaymentAlert(false)}
          header="Confirmar Pagamento"
          message={`Deseja registrar o pagamento de ${formatCurrency(editedValue)} para ${selectedPayment?.clientName || 'este cliente'}?`}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Confirmar',
              handler: confirmPayment
            }
          ]}
        />

        {/* Toast */}
        <Toast
          isOpen={toast.isOpen}
          message={toast.message}
          color={toast.color}
          onDidDismiss={() => setToast({ ...toast, isOpen: false })}
        />
      </IonContent>
    </IonPage>
  );
};

export default Cobrancas;
