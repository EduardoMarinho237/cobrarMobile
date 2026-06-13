import React, { useState, useEffect, useMemo } from 'react';
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
import { create, refresh, cashOutline, personOutline, locationOutline, callOutline, timeOutline } from 'ionicons/icons';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import { 
  getDailySchedule, 
  getPendingCollectionsPaginated,
  createDebit, 
  PendingPayment, 
  DailySchedule, 
  CreateDebitRequest 
} from '../../services/debitApi';
import { getClientById, Client } from '../../services/clientApi';
import { getCreditsByClient, getCredit, Credit, getCreditHistory, CreditHistoryEntry } from '../../services/creditApi';
import Toast from '../../components/Toast';
import ListSearchHeader from '../../components/ListSearchHeader';
import { matchesSearchQuery, collectSearchableValues } from '../../utils/listSearch';
import { useTranslation } from 'react-i18next';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useInView } from 'react-intersection-observer';

const Cobrancas: React.FC = () => {
  const { t } = useTranslation();
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentCredit, setPaymentCredit] = useState<Credit | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [clientCredits, setClientCredits] = useState<Credit[]>([]);
  const [editedValues, setEditedValues] = useState<{ [key: number]: number }>({});
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCreditId, setActiveCreditId] = useState<number | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [creditHistory, setCreditHistory] = useState<CreditHistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const {
    items: pendingPayments,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteScroll<PendingPayment>({
    fetchPage: async (page, size) => {
      const response = await getPendingCollectionsPaginated(page, size);
      return {
        content: response.content,
        last: response.last,
        totalElements: response.totalElements,
      };
    },
    pageSize: 30,
  });

  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasMore && !isLoading && !isLoadingMore) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, isLoadingMore, loadMore]);

  useEffect(() => {
    loadData();
  }, []);

  const getDebtColor = (payment: PendingPayment): string => {
    const daysLate = payment.overdueInstallmentsCount ?? 0;

    if (!payment.hasOverdueInstallments || daysLate === 0) {
      return '#3963db'; // azul
    }

    if (daysLate <= 3) {
      return '#fac002'; // amarelo
    }

    if (daysLate <= 7) {
      return '#ff7300'; // laranja
    }

    return '#da0d28'; // vermelho
  };  

  const loadData = async () => {
    try {
      const scheduleData = await getDailySchedule();
      setDailySchedule(scheduleData);
      await refresh();
    } catch (error: any) {
      console.error('Erro ao carregar agenda diária:', error);
      showToast(error.message || t('pages.collections.errorLoadingSchedule'), 'danger');
      setDailySchedule({
        pendingPayments: [],
        dailyExpectation: 0,
        collectedToday: 0,
        remainingToCollect: 0
      });
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handlePayment = async (payment: PendingPayment) => {
    const currentValue = editedValues[payment.creditId] ?? payment.installmentValue;

    if (currentValue <= 0) {
      showToast(t('pages.collections.valueMustBeGreaterThanZero'), 'danger');
      return;
    }

    try {
      const credit = await getCredit(payment.creditId);
      if (!credit) {
        showToast(t('pages.collections.errorRegisteringPayment'), 'danger');
        return;
      }

      setSelectedPayment(payment);
      setPaymentCredit(credit);
      setEditedValues(prev => ({ ...prev, [payment.creditId]: currentValue }));
      setShowPaymentModal(true);
    } catch (error) {
      showToast(t('pages.collections.errorRegisteringPayment'), 'danger');
    }
  };

  const getPaymentValue = () => {
    if (!selectedPayment) return 0;
    return editedValues[selectedPayment.creditId] ?? selectedPayment.installmentValue;
  };

  const calculateInitialDebt = (credit: Credit) => {
    return credit.initialValue + (credit.initialValue * credit.tax / 100);
  };

  const buildWhatsAppMessage = (
    clientName: string,
    amountPaid: number,
    initialDebt: number,
    remainingDebt: number,
    transactionId: number
  ) => {
    return [
      `${t('pages.collections.whatsappShareClientName')}: ${clientName}`,
      `${t('pages.collections.whatsappShareAmountPaid')}: ${formatCurrencyWithSymbol(amountPaid)}`,
      `${t('pages.collections.whatsappShareInitialDebt')}: ${formatCurrencyWithSymbol(initialDebt)}`,
      `${t('pages.collections.whatsappShareRemaining')}: ${formatCurrencyWithSymbol(remainingDebt)}`,
      `${t('pages.collections.whatsappShareTransactionId')}: ${transactionId}`
    ].join('\n');
  };

  const openWhatsAppShare = (message: string) => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
    setPaymentCredit(null);
  };

  const confirmPayment = async (shareOnWhatsApp: boolean) => {
    if (!selectedPayment || !paymentCredit || isProcessingPayment) return;

    const paidValue = getPaymentValue();
    const debitRequest: CreateDebitRequest = {
      value: paidValue,
      creditId: selectedPayment.creditId,
      changeAllDays: false
    };

    setIsProcessingPayment(true);
    try {
      const response = await createDebit(debitRequest);
      if (response.success && response.data) {
        let remainingDebt = Math.max(paymentCredit.totalDebt - paidValue, 0);

        try {
          const updatedCredit = await getCredit(selectedPayment.creditId);
          if (updatedCredit) {
            remainingDebt = updatedCredit.totalDebt;
          }
        } catch (error) {
          console.error('Erro ao buscar saldo atualizado do crédito:', error);
        }

        if (shareOnWhatsApp && response.data.id) {
          const message = buildWhatsAppMessage(
            selectedPayment.clientName,
            paidValue,
            calculateInitialDebt(paymentCredit),
            remainingDebt,
            response.data.id
          );
          openWhatsAppShare(message);
        }

        showToast(t('pages.collections.paymentRegisteredSuccess'), 'success');
        closePaymentModal();
        setEditedValues({});
        loadData();
      } else {
        showToast(response.message || t('pages.collections.errorRegisteringPayment'), 'danger');
      }
    } catch (error) {
      showToast(t('pages.collections.errorRegisteringPayment'), 'danger');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  

  const calculateClientSummary = (credits: Credit[]) => {
    const totalInitialValue = credits.reduce((sum, credit) => sum + credit.initialValue, 0);
    const totalDebt = credits.reduce((sum, credit) => sum + credit.totalDebt, 0);
    const totalRemainingDebt = credits.reduce((sum, credit) => sum + credit.totalDebt, 0);
    const totalInstallments = credits.reduce((sum, credit) => sum + credit.quantityDays, 0);
    const paidInstallments = credits.reduce((sum, credit) => sum + (credit.quantityDays - Math.ceil(credit.totalDebt / credit.dayValue)), 0);
    const remainingInstallments = totalInstallments - paidInstallments;

    return {
      totalInitialValue,
      totalDebt,
      totalRemainingDebt,
      remainingInstallments
    };
  };

  const filteredPayments = useMemo(() => {
    return pendingPayments.filter((payment) =>
      matchesSearchQuery(
        searchQuery,
        ...collectSearchableValues(payment)
      )
    );
  }, [pendingPayments, searchQuery]);

  const openClientModal = async (clientId: number, creditId?: number) => {
    const client = await getClientById(clientId);
    if (client) {
      setSelectedClient(client);
      setActiveCreditId(creditId ?? null);
      try {
        // Se um creditId for fornecido, busca apenas esse crédito específico
        if (creditId) {
          const credit = await getCredit(creditId);
          setSelectedCredit(credit);
          setClientCredits(credit ? [credit] : []);
        } else {
          // Se não, busca todos os créditos do cliente (comportamento anterior)
          const credits = await getCreditsByClient(clientId);
          setClientCredits(credits);
          setSelectedCredit(null);
        }
      } catch (error) {
        console.error('Erro ao carregar créditos do cliente:', error);
        setClientCredits([]);
        setSelectedCredit(null);
      }
      setShowClientModal(true);
    }
  };

  const getHistoryEventLabel = (eventType: CreditHistoryEntry['eventType']) => {
    switch (eventType) {
      case 'DEBIT_APPLIED':
        return t('pages.collections.historyPayment');
      case 'DEBIT_UNDONE':
        return t('pages.collections.historyPaymentUndone');
      case 'DEBIT_DELETED':
        return t('pages.collections.historyPaymentDeleted');
      case 'CREDIT_CREATED':
        return t('pages.collections.historyCreditCreated');
      case 'CREDIT_UPDATED':
        return t('pages.collections.historyCreditUpdated');
      default:
        return eventType;
    }
  };

  const formatHistoryDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openPaymentHistory = async () => {
    const creditId = activeCreditId ?? selectedCredit?.id;
    if (!creditId) {
      return;
    }

    setIsHistoryLoading(true);
    setShowHistoryModal(true);
    try {
      const history = await getCreditHistory(creditId);
      const paymentEvents = history.filter((entry) =>
        ['DEBIT_APPLIED', 'DEBIT_UNDONE', 'DEBIT_DELETED'].includes(entry.eventType)
      );
      setCreditHistory(paymentEvents.length > 0 ? paymentEvents : history);
    } catch (error) {
      showToast(t('pages.collections.errorLoadingHistory'), 'danger');
      setCreditHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  return (
    <IonPage>
      <ListSearchHeader
        title={t('pages.collections.title')}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />
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
          ) : pendingPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('pages.collections.noCollectionsToday')}</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('common.noSearchResults')}</p>
            </div>
          ) : (
            <>
            {filteredPayments.map((payment) => (
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
                          onClick={() => openClientModal(payment.clientId, payment.creditId)}
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
                            {payment.address || t('pages.collections.addressNotAvailable')}
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
                            {payment.phone || t('pages.collections.phoneNotAvailable')}
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
                            size="small"
                            onClick={() => handlePayment(payment)}
                            style={{
                              margin: 0,
                              width: '36px',
                              height: '36px',
                              '--padding-start': '0',
                              '--padding-end': '0',
                              '--background': getDebtColor(payment),
                              '--color': '#fff'
                            } as any}
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
            ))}
            {/* Sentinel para infinite scroll */}
            <div ref={sentinelRef} style={{ height: '40px', textAlign: 'center', padding: '10px' }}>
              {isLoadingMore && <IonSpinner name="dots" />}
            </div>
            </>
          )}
        </div>

        {/* Modal de Detalhes do Cliente */}
        <IonModal isOpen={showClientModal} onDidDismiss={() => setShowClientModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.collections.clientInfo')}</IonTitle>
              <IonButtons slot="end">
                {(activeCreditId || selectedCredit?.id) && (
                  <IonButton onClick={openPaymentHistory}>
                    <IonIcon slot="start" icon={timeOutline} />
                    {t('pages.collections.paymentHistory')}
                  </IonButton>
                )}
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
                
                {/* Informações de Resumo da Dívida */}
                {clientCredits.length > 0 && (() => {
                  const summary = calculateClientSummary(clientCredits);
                  return (
                    <>
                      <div style={{ 
                        marginTop: '20px', 
                        padding: '16px', 
                        backgroundColor: 'var(--ion-color-light)', 
                        borderRadius: '8px' 
                      }}>
                        <h4 style={{ margin: '0 0 12px 0', color: 'var(--ion-color-dark)' }}>
                          {t('pages.collections.debtSummary')}
                        </h4>
                        <IonItem style={{ marginBottom: '8px' }}>
                          <IonLabel>
                            <h3>{t('pages.collections.remainingInstallments')}</h3>
                            <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--ion-color-dark)' }}>
                              {summary.remainingInstallments} {t('pages.collections.installments')}
                            </p>
                          </IonLabel>
                        </IonItem>
                        <IonItem style={{ marginBottom: '8px' }}>
                          <IonLabel>
                            <h3>{t('pages.collections.remainingDebt')}</h3>
                            <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--ion-color-dark)' }}>
                              {formatCurrencyWithSymbol(summary.totalRemainingDebt)}
                            </p>
                          </IonLabel>
                        </IonItem>
                        <IonItem style={{ marginBottom: '8px' }}>
                          <IonLabel>
                            <h3>{t('pages.collections.totalDebtWithInterest')}</h3>
                            <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--ion-color-dark)' }}>
                              {formatCurrencyWithSymbol(summary.totalDebt)}
                            </p>
                          </IonLabel>
                        </IonItem>
                      </div>

                      {/* Detalhes da Dívida */}
                      <div style={{ 
                        marginTop: '16px', 
                        padding: '16px', 
                        backgroundColor: 'var(--ion-color-light)', 
                        borderRadius: '8px' 
                      }}>
                        <h4 style={{ margin: '0 0 12px 0', color: 'var(--ion-color-dark)' }}>
                          {t('pages.collections.debtDetails')}
                        </h4>
                        {clientCredits.map((credit, index) => {
                          const paidAmount = (credit.initialValue + (credit.initialValue * credit.tax / 100)) - credit.totalDebt;
                          const progressPercentage = ((credit.initialValue + (credit.initialValue * credit.tax / 100)) > 0) 
                            ? (paidAmount / (credit.initialValue + (credit.initialValue * credit.tax / 100))) * 100 
                            : 0;
                          
                          return (
                            <div key={credit.id} style={{ marginBottom: index < clientCredits.length - 1 ? '16px' : '0' }}>
                              <div style={{ marginBottom: '8px' }}>
                                <IonItem>
                                  <IonLabel>
                                    <h3>
                                      {t('pages.collections.debtStartDate')}
                                    </h3>
                                    <p>
                                      {new Date(credit.startDate).toLocaleDateString('pt-BR')}
                                    </p>
                                  </IonLabel>
                                </IonItem>
                                <IonItem>
                                  <IonLabel>
                                    <h3>
                                      {t('pages.collections.debtInterestRate')}
                                    </h3>
                                    <p>
                                      {credit.tax}%
                                    </p>
                                  </IonLabel>
                                </IonItem>
                                <IonItem>
                                  <IonLabel>
                                    <h3>
                                      {t('pages.collections.debtInstallmentValue')}
                                    </h3>
                                    <p>
                                      {formatCurrencyWithSymbol(credit.dayValue)}
                                    </p>
                                  </IonLabel>
                                </IonItem>
                                {credit.totalDebt > 0 && (
                                  <IonItem>
                                    <IonLabel>
                                      <h3>
                                        {t('pages.collections.debtOverdueValue')}
                                      </h3>
                                      <p>
                                        {formatCurrencyWithSymbol(credit.totalDebt)}
                                      </p>
                                    </IonLabel>
                                  </IonItem>
                                )}
                              </div>

                              {/* Barra de Progresso */}
                              <div style={{ marginTop: '12px' }}>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  marginBottom: '4px',
                                  fontSize: '12px',
                                  color: 'var(--ion-color-dark)'
                                }}>
                                  <span>{t('pages.collections.debtProgress')}</span>
                                  <span>{Math.round(progressPercentage)}%</span>
                                </div>
                                <div style={{ 
                                  width: '100%', 
                                  height: '8px', 
                                  backgroundColor: '#e9ecef', 
                                  borderRadius: '4px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{ 
                                    width: `${progressPercentage}%`, 
                                    height: '100%', 
                                    backgroundColor: '#007bff',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  marginTop: '4px',
                                  fontSize: '11px',
                                  color: 'var(--ion-color-dark)'
                                }}>
                                  <span>{t('pages.collections.debtPaid')}: {formatCurrencyWithSymbol(paidAmount)}</span>
                                  <span>{t('pages.collections.debtRemaining')}: {formatCurrencyWithSymbol(credit.totalDebt)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonModal isOpen={showHistoryModal} onDidDismiss={() => setShowHistoryModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.collections.paymentHistory')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowHistoryModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              {isHistoryLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <IonSpinner name="dots" />
                  <p style={{ color: '#666', marginTop: '16px' }}>{t('pages.collections.loadingHistory')}</p>
                </div>
              ) : creditHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>{t('pages.collections.noPaymentHistory')}</p>
                </div>
              ) : (
                creditHistory.map((entry) => (
                  <IonCard key={`${entry.eventType}-${entry.id}-${entry.occurredAt}`} style={{ marginBottom: '12px', borderRadius: '12px' }}>
                    <IonCardContent>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                            {getHistoryEventLabel(entry.eventType)}
                          </h3>
                          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
                            {formatHistoryDate(entry.occurredAt)}
                          </p>
                          {entry.debitValue != null && (
                            <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', color: entry.eventType === 'DEBIT_APPLIED' ? '#28a745' : '#dc3545' }}>
                              {formatCurrencyWithSymbol(entry.debitValue)}
                            </p>
                          )}
                          {entry.totalDebt != null && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
                              {t('pages.collections.historyRemainingDebt')}: {formatCurrencyWithSymbol(entry.totalDebt)}
                            </p>
                          )}
                        </div>
                        {entry.debitActive != null && (
                          <IonText color={entry.debitActive ? 'success' : 'medium'}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                              {entry.debitActive ? t('pages.collections.historyActive') : t('pages.collections.historyUndone')}
                            </span>
                          </IonText>
                        )}
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))
              )}
            </div>
          </IonContent>
        </IonModal>

        
        {/* Modal de Confirmação de Pagamento */}
        <IonModal isOpen={showPaymentModal} onDidDismiss={closePaymentModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.collections.confirmPaymentModalTitle')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closePaymentModal} disabled={isProcessingPayment}>
                  {t('common.close')}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <p style={{ margin: '0 0 24px 0', color: '#444', lineHeight: 1.5 }}>
                {t('pages.collections.confirmPaymentModalMessage')
                  .replace('{value}', formatCurrencyWithSymbol(getPaymentValue()))
                  .replace('{clientName}', selectedPayment?.clientName || t('pages.collections.thisClient'))}
              </p>

              <IonButton
                expand="block"
                shape="round"
                color="success"
                style={{ marginBottom: '12px' }}
                disabled={isProcessingPayment}
                onClick={() => confirmPayment(true)}
              >
                {t('pages.collections.confirmAndShare')}
              </IonButton>

              <IonButton
                expand="block"
                shape="round"
                fill="outline"
                disabled={isProcessingPayment}
                onClick={() => confirmPayment(false)}
              >
                {t('pages.collections.confirm')}
              </IonButton>

              {isProcessingPayment && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <IonSpinner name="dots" />
                </div>
              )}
            </div>
          </IonContent>
        </IonModal>

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
