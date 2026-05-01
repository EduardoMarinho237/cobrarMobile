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
import { formatCurrencyWithSymbol } from '../../utils/currency';
import { 
  getDailySchedule, 
  createDebit, 
  PendingPayment, 
  DailySchedule, 
  CreateDebitRequest 
} from '../../services/debitApi';
import { getClientById, Client } from '../../services/clientApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';

const Cobrancas: React.FC = () => {
  const { t } = useTranslation();
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | null>(null);
  const [clients, setClients] = useState<{ [key: number]: Client }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPaymentAlert, setShowPaymentAlert] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [editedValues, setEditedValues] = useState<{ [key: number]: number }>({});
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
      showToast(error.message || t('pages.collections.errorLoadingSchedule'), 'danger');
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
    const currentValue = editedValues[payment.creditId] ?? payment.installmentValue;
    
    if (currentValue <= 0) {
      showToast(t('pages.collections.valueMustBeGreaterThanZero'), 'danger');
      return;
    }
    
    setSelectedPayment(payment);
    setEditedValues(prev => ({ ...prev, [payment.creditId]: currentValue }));
    setShowPaymentAlert(true);
  };


  const confirmPayment = async () => {
    if (!selectedPayment) return;

    const debitRequest: CreateDebitRequest = {
      value: editedValues[selectedPayment.creditId] || selectedPayment.installmentValue,
      creditId: selectedPayment.creditId,
      changeAllDays: false
    };

    try {
      const response = await createDebit(debitRequest);
      if (response.success) {
        showToast(t('pages.collections.paymentRegisteredSuccess'), 'success');
        setShowPaymentAlert(false);
        setSelectedPayment(null);
        setEditedValues({});
        loadData(); // Recarregar agenda
      } else {
        showToast(response.message || t('pages.collections.errorRegisteringPayment'), 'danger');
      }
    } catch (error) {
      showToast(t('pages.collections.errorRegisteringPayment'), 'danger');
    }
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
          <IonTitle>{t('pages.collections.title')}</IonTitle>
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
                  <IonCard style={{ textAlign: 'center', borderRadius: '12px', background: 'var(--ion-color-light)' }}>
                    <IonCardContent>
                      <IonIcon icon={cashOutline} style={{ fontSize: '24px', color: '#007bff' }} />
                      <h4 style={{ margin: '8px 0 4px 0', color: '#007bff' }}>
                        {formatCurrencyWithSymbol(dailySchedule.dailyExpectation)}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{t('pages.collections.dailyGoal')}</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="4">
                  <IonCard style={{ textAlign: 'center', borderRadius: '12px', background: 'var(--ion-color-light)' }}>
                    <IonCardContent>
                      <IonIcon icon={cashOutline} style={{ fontSize: '24px', color: '#28a745' }} />
                      <h4 style={{ margin: '8px 0 4px 0', color: '#28a745' }}>
                        {formatCurrencyWithSymbol(dailySchedule.collectedToday)}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{t('pages.collections.collected')}</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="4">
                  <IonCard style={{ textAlign: 'center', borderRadius: '12px', background: 'var(--ion-color-light)' }}>
                    <IonCardContent>
                      <IonIcon icon={cashOutline} style={{ fontSize: '24px', color: '#dc3545' }} />
                      <h4 style={{ margin: '8px 0 4px 0', color: '#dc3545' }}>
                        {formatCurrencyWithSymbol(dailySchedule.remainingToCollect)}
                      </h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{t('pages.collections.remaining')}</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', marginTop: '16px' }}>{t('pages.collections.loadingCollections')}</p>
            </div>
          ) : !dailySchedule || dailySchedule.pendingPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('pages.collections.noCollectionsToday')}</p>
            </div>
          ) : (
            dailySchedule.pendingPayments.map((payment) => {
              const clientInfo = getClientInfo(payment.clientId);
              return (
                <IonCard 
                  key={payment.creditId} 
                  style={{ 
                    marginBottom: '16px',
                    borderRadius: '12px',
                    background: '#ffffff'
                  }}
                >
                  <IonCardHeader>
                    <IonCardTitle>{payment.clientName}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Linha principal: informações e valor */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        {/* Informações do cliente */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              marginBottom: '8px',
                              cursor: 'pointer'
                            }}
                            onClick={() => openClientModal(payment.clientId)}
                          >
                            <IonIcon 
                              icon={locationOutline} 
                              style={{ 
                                marginRight: '8px', 
                                color: '#666', 
                                fontSize: '14px',
                                flexShrink: 0
                              }} 
                            />
                            <p style={{ 
                              color: '#666', 
                              fontSize: '13px', 
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {clientInfo?.address || t('pages.collections.addressNotAvailable')}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <IonIcon 
                              icon={callOutline} 
                              style={{ 
                                marginRight: '8px', 
                                color: '#666', 
                                fontSize: '14px',
                                flexShrink: 0
                              }} 
                            />
                            <p style={{ 
                              color: '#666', 
                              fontSize: '13px', 
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {clientInfo?.phone || t('pages.collections.phoneNotAvailable')}
                            </p>
                          </div>
                        </div>
                        
                        {/* Campo de valor e botão */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          flexShrink: 0,
                          width: '120px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <IonInput
                              type="number"
                              value={editedValues[payment.creditId] !== undefined ? editedValues[payment.creditId] : payment.installmentValue}
                              onIonInput={(e: any) => {
                                const value = e.detail.value === '' ? 0 : Number(e.detail.value);
                                setEditedValues(prev => ({ ...prev, [payment.creditId]: value }));
                              }}
                              style={{ 
                                textAlign: 'center', 
                                fontSize: '13px',
                                height: '36px'
                              }}
                            />
                          </div>
                          <IonButton
                            color="success"
                            size="small"
                            onClick={() => handlePayment(payment)}
                            style={{ 
                              margin: 0,
                              width: '36px',
                              height: '36px',
                              '--padding-start': '0',
                              '--padding-end': '0'
                            }}
                          >
                            <IonIcon icon={cashOutline} style={{ fontSize: '16px' }} />
                          </IonButton>
                        </div>
                      </div>
                      {payment.hasOverdueInstallments && (
                        <div style={{ marginTop: '8px' }}>
                          <IonText color="danger">
                            <p style={{ fontSize: '12px', margin: 0 }}>
                              ⚠️ {payment.overdueInstallmentsCount} {t('pages.collections.daysLate')} - {formatCurrencyWithSymbol(payment.accumulatedOverdueValue)} {t('pages.collections.accumulated')}
                            </p>
                          </IonText>
                        </div>
                      )}
                    </div>
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
              <IonTitle>{t('pages.collections.clientInfo')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowClientModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedClient && (
              <div style={{ padding: '16px' }}>
                <IonItem>
                  <IonIcon icon={personOutline} style={{ marginRight: '12px', color: '#666' }} />
                  <IonLabel>
                    <h3>{t('pages.collections.name')}</h3>
                    <p>{selectedClient.name}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={callOutline} style={{ marginRight: '12px', color: '#666' }} />
                  <IonLabel>
                    <h3>{t('pages.collections.phone')}</h3>
                    <p>{selectedClient.phone || t('pages.collections.notInformed')}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={locationOutline} style={{ marginRight: '12px', color: '#666' }} />
                  <IonLabel>
                    <h3>{t('pages.collections.address')}</h3>
                    <p>{selectedClient.address || t('pages.collections.notInformed')}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <h3>{t('pages.collections.shop')}</h3>
                    <p>{selectedClient.shop || t('pages.collections.notInformed')}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>
                    <h3>{t('pages.collections.cpf')}</h3>
                    <p>{selectedClient.cpf || t('pages.collections.notInformed')}</p>
                  </IonLabel>
                </IonItem>
              </div>
            )}
          </IonContent>
        </IonModal>

        
        {/* Alert de Confirmação de Pagamento */}
        <IonAlert
          isOpen={showPaymentAlert}
          onDidDismiss={() => setShowPaymentAlert(false)}
          header={t('pages.collections.confirmPayment')}
          message={t('pages.collections.confirmPaymentMessage').replace('{value}', formatCurrencyWithSymbol(editedValues[selectedPayment?.creditId || 0] || selectedPayment?.installmentValue || 0)).replace('{clientName}', selectedPayment?.clientName || t('pages.collections.thisClient'))}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('pages.collections.confirm'),
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
