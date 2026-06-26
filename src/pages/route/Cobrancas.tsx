import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonItem,
  IonModal,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonInput,
  IonSpinner,
} from '@ionic/react';
import { cashOutline, locationOutline, callOutline, timeOutline, searchOutline, close, arrowUndo, warning } from 'ionicons/icons';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import { formatToBrazilTime } from '../../utils/dateFormat';
import { 
  getDailySchedule, 
  getPendingCollectionsPaginated,
  getTodayDebitsTotal,
  getTodayDebitsPaginated,
  undoDebit,
  createDebit, 
  PendingPayment, 
  DailySchedule, 
  CreateDebitRequest,
  Debit
} from '../../services/debitApi';
import { getClientById, Client } from '../../services/clientApi';
import { getCreditsByClient, getCredit, Credit, getCreditHistory, CreditHistoryEntry } from '../../services/creditApi';
import Toast from '../../components/Toast';
import ListSearchHeader from '../../components/ListSearchHeader';
import { matchesSearchQuery, collectSearchableValues } from '../../utils/listSearch';
import { useTranslation } from 'react-i18next';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useInView } from 'react-intersection-observer';
import GreenHeader from '../../components/ui/GreenHeader';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InfoRow from '../../components/ui/InfoRow';
import ActionButton from '../../components/ui/ActionButton';

const inputStyle = {
  '--background': '#f5f5f5',
  '--border-radius': '12px',
  '--padding-start': '16px',
  '--inner-padding-end': '16px',
  '--min-height': '52px',
  marginBottom: '8px',
} as any;

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
  const [todayDebitsSearchQuery, setTodayDebitsSearchQuery] = useState('');
  const [todayDebitsSearchKey, setTodayDebitsSearchKey] = useState(0);
  const [activeCreditId, setActiveCreditId] = useState<number | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [creditHistory, setCreditHistory] = useState<CreditHistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [showTodayDebitsModal, setShowTodayDebitsModal] = useState(false);
  const [todayDebits, setTodayDebits] = useState<Debit[]>([]);
  const [isLoadingTodayDebits, setIsLoadingTodayDebits] = useState(false);
  const [showUndoAlertModal, setShowUndoAlertModal] = useState(false);
  const [selectedDebitModal, setSelectedDebitModal] = useState<Debit | null>(null);

  const {
    items: pendingPayments,
    isLoading,
    isLoadingMore,
    isLoadingAll,
    hasMore,
    loadMore,
    refresh: refreshPayments,
    loadAllPages,
  } = useInfiniteScroll<PendingPayment>({
    fetchPage: async (page, size) => {
      const response = await getPendingCollectionsPaginated(page, size);
      return { content: response.content, last: response.last, totalElements: response.totalElements };
    },
    pageSize: 30,
  });

  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasMore && !isLoading && !isLoadingMore) loadMore();
  }, [inView, hasMore, isLoading, isLoadingMore, loadMore]);

  const hasLoadedAllForSearch = useRef(false);
  const prevSearchQuery = useRef('');

  useEffect(() => {
    if (searchQuery && !hasLoadedAllForSearch.current) { hasLoadedAllForSearch.current = true; loadAllPages(); }
    if (!searchQuery && prevSearchQuery.current) { hasLoadedAllForSearch.current = false; refreshPayments(); }
    prevSearchQuery.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => { loadData(); }, []);

  const getDebtColor = (payment: PendingPayment): string => {
    const daysLate = payment.overdueInstallmentsCount ?? 0;
    if (!payment.hasOverdueInstallments || daysLate === 0) return '#098947';
    if (daysLate <= 3) return '#fac002';
    if (daysLate <= 7) return '#ff7300';
    return '#da0d28';
  };

  const loadData = async () => {
    try {
      const scheduleData = await getDailySchedule();
      setDailySchedule(scheduleData);
      if (searchQuery) { hasLoadedAllForSearch.current = false; await loadAllPages(); }
      else await refreshPayments();
      await loadTodayTotal();
    } catch {
      showToast(t('pages.collections.errorLoadingSchedule'), 'danger');
      setDailySchedule({ pendingPayments: [], dailyExpectation: 0, collectedToday: 0, remainingToCollect: 0 });
    }
  };

  const loadTodayTotal = async () => {
    try { const total = await getTodayDebitsTotal(); setTodayTotal(total); }
    catch { console.error('Erro loading today debits total'); }
  };

  const loadTodayDebits = async () => {
    setIsLoadingTodayDebits(true);
    try {
      const response = await getTodayDebitsPaginated(0, 1000);
      const sorted = [...response.content].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTodayDebits(sorted);
    } catch { console.error('Erro loading today debits'); }
    finally { setIsLoadingTodayDebits(false); }
  };

  const openTodayDebitsModal = async () => {
    await loadTodayDebits();
    setShowTodayDebitsModal(true);
  };

  const handleUndoFromModal = (debit: Debit) => {
    setSelectedDebitModal(debit);
    setShowUndoAlertModal(true);
  };

  const confirmUndoFromModal = async () => {
    if (!selectedDebitModal) return;
    try {
      const response = await undoDebit(selectedDebitModal.id);
      if (response.success) {
        showToast(t('pages.collected.debitUndoneSuccess'), 'success');
        setShowUndoAlertModal(false);
        setSelectedDebitModal(null);
        await loadTodayDebits();
        await loadTodayTotal();
      } else {
        showToast(response.message || t('pages.collected.errorUndoingDebit'), 'danger');
      }
    } catch { showToast(t('pages.collected.errorUndoingDebit'), 'danger'); }
  };

  const showToast = (message: string, color: string) => setToast({ isOpen: true, message, color });

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
      setShowPaymentModal(true);
    } catch {
      showToast(t('pages.collections.errorRegisteringPayment'), 'danger');
    }
  };
  const getPaymentValue = () => {
    if (!selectedPayment) return 0;
    return editedValues[selectedPayment.creditId] ?? selectedPayment.installmentValue;
  };

  const calculateInitialDebt = (credit: Credit) => credit.initialValue + (credit.initialValue * credit.tax / 100);

  const buildWhatsAppMessage = (clientName: string, amountPaid: number, initialDebt: number, remainingDebt: number, transactionId: string | number) => {
    return [
      `${t('pages.collections.whatsappShareClientName')}: ${clientName}`,
      `${t('pages.collections.whatsappShareAmountPaid')}: ${formatCurrencyWithSymbol(amountPaid)}`,
      `${t('pages.collections.whatsappShareInitialDebt')}: ${formatCurrencyWithSymbol(initialDebt)}`,
      `${t('pages.collections.whatsappShareRemaining')}: ${formatCurrencyWithSymbol(remainingDebt)}`,
      `${t('pages.collections.whatsappShareTransactionId')}: ${transactionId}`
    ].join('\n');
  };

  const openWhatsAppShare = (message: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
    setPaymentCredit(null);
  };

  const confirmPayment = async (shareOnWhatsApp: boolean) => {
    if (!selectedPayment || !paymentCredit || isProcessingPayment) return;
    const paidValue = getPaymentValue();
    const debitRequest: CreateDebitRequest = { value: paidValue, creditId: selectedPayment.creditId, changeAllDays: false };
    setIsProcessingPayment(true);
    try {
      const response = await createDebit(debitRequest);
      if (response.success && response.data) {
        let remainingDebt = Math.max(paymentCredit.totalDebt - paidValue, 0);
        try {
          const updatedCredit = await getCredit(selectedPayment.creditId);
          if (updatedCredit) remainingDebt = updatedCredit.totalDebt;
        } catch { console.error('Erro'); }
        if (shareOnWhatsApp && (response.data.transactionId || response.data.id)) {
          const message = buildWhatsAppMessage(selectedPayment.clientName, paidValue, calculateInitialDebt(paymentCredit), remainingDebt, response.data.transactionId || String(response.data.id));
          openWhatsAppShare(message);
        }
        showToast(t('pages.collections.paymentRegisteredSuccess'), 'success');
        closePaymentModal();
        setEditedValues({});
        loadData();
      } else {
        showToast(response.message || t('pages.collections.errorRegisteringPayment'), 'danger');
      }
    } catch { showToast(t('pages.collections.errorRegisteringPayment'), 'danger'); }
    finally { setIsProcessingPayment(false); }
  };

  const calculateClientSummary = (credits: Credit[]) => {
    const totalInitialValue = credits.reduce((sum, credit) => sum + credit.initialValue, 0);
    const totalDebt = credits.reduce((sum, credit) => sum + credit.totalDebt, 0);
    const totalRemainingDebt = credits.reduce((sum, credit) => sum + credit.totalDebt, 0);
    const totalInstallments = credits.reduce((sum, credit) => sum + credit.quantityDays, 0);
    const paidInstallments = credits.reduce((sum, credit) => sum + (credit.quantityDays - Math.ceil(credit.totalDebt / credit.dayValue)), 0);
    return { totalInitialValue, totalDebt, totalRemainingDebt, remainingInstallments: totalInstallments - paidInstallments };
  };

  const filteredPayments = useMemo(() => pendingPayments.filter((p) => matchesSearchQuery(searchQuery, ...collectSearchableValues(p))), [pendingPayments, searchQuery]);

  const filteredTodayDebits = useMemo(() => {
    if (!todayDebitsSearchQuery) return todayDebits;
    return todayDebits.filter((d) => matchesSearchQuery(todayDebitsSearchQuery, d.clientName, d.value.toString(), d.createdAt));
  }, [todayDebits, todayDebitsSearchQuery]);

  const openClientModal = async (clientId: number, creditId?: number) => {
    const client = await getClientById(clientId);
    if (client) {
      setSelectedClient(client);
      setActiveCreditId(creditId ?? null);
      try {
        if (creditId) {
          const credit = await getCredit(creditId);
          setSelectedCredit(credit);
          setClientCredits(credit ? [credit] : []);
        } else {
          const credits = await getCreditsByClient(clientId);
          setClientCredits(credits);
          setSelectedCredit(null);
        }
      } catch { setClientCredits([]); setSelectedCredit(null); }
      setShowClientModal(true);
    }
  };

  const getHistoryEventLabel = (eventType: CreditHistoryEntry['eventType']) => {
    switch (eventType) {
      case 'DEBIT_APPLIED': return t('pages.collections.historyPayment');
      case 'DEBIT_UNDONE': return t('pages.collections.historyPaymentUndone');
      case 'DEBIT_DELETED': return t('pages.collections.historyPaymentDeleted');
      case 'CREDIT_CREATED': return t('pages.collections.historyCreditCreated');
      case 'CREDIT_UPDATED': return t('pages.collections.historyCreditUpdated');
      default: return eventType;
    }
  };

  const formatHistoryDate = (dateString: string) => new Date(dateString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const openPaymentHistory = async () => {
    const creditId = activeCreditId ?? selectedCredit?.id;
    if (!creditId) return;
    setIsHistoryLoading(true);
    setShowHistoryModal(true);
    try {
      const history = await getCreditHistory(creditId);
      const paymentEvents = history.filter((entry) => ['DEBIT_APPLIED', 'DEBIT_UNDONE', 'DEBIT_DELETED'].includes(entry.eventType));
      setCreditHistory(paymentEvents.length > 0 ? paymentEvents : history);
    } catch { showToast(t('pages.collections.errorLoadingHistory'), 'danger'); setCreditHistory([]); }
    finally { setIsHistoryLoading(false); }
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
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 16px))' }}>
          {dailySchedule && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: t('pages.collections.dailyGoal'), value: dailySchedule.dailyExpectation, color: '#098947' },
                { label: t('pages.collections.collected'), value: dailySchedule.collectedToday, color: '#28a745' },
                { label: t('pages.collections.remaining'), value: dailySchedule.remainingToCollect, color: '#dc3545' },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, backgroundColor: '#fff', borderRadius: '14px', padding: '14px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: item.color, borderRadius: '14px 0 0 14px' }} />
                  <div style={{ paddingLeft: '6px', textAlign: 'center' }}>
                    <IonIcon icon={cashOutline} style={{ fontSize: '20px', color: item.color, display: 'block', margin: '0 auto 6px' }} />
                    <div style={{ fontSize: '14px', fontWeight: 700, color: item.color }}>{formatCurrencyWithSymbol(item.value)}</div>
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '2px', fontWeight: 500 }}>{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoading || isLoadingAll ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', marginTop: '16px' }}>{isLoadingAll ? t('common.loading') : t('pages.collections.loadingCollections')}</p>
            </div>
          ) : pendingPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}><p>{t('pages.collections.noCollectionsToday')}</p></div>
          ) : filteredPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}><p>{t('common.noSearchResults')}</p></div>
          ) : (
            <>
              {filteredPayments.map((payment) => {
                const debtColor = getDebtColor(payment);
                return (
                  <div key={payment.creditId} style={{
                    backgroundColor: '#fff', borderRadius: '16px', padding: '18px', marginBottom: '12px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: debtColor, borderRadius: '16px 0 0 16px' }} />
                    <div style={{ paddingLeft: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{ fontSize: '15px', fontWeight: 700, color: '#262626', cursor: 'pointer', display: 'block', marginBottom: '6px' }}
                            onClick={() => openClientModal(payment.clientId, payment.creditId)}
                          >
                            {payment.clientName}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <IonIcon icon={locationOutline} style={{ fontSize: '12px', color: '#999', flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {payment.address || t('pages.collections.addressNotAvailable')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <IonIcon icon={callOutline} style={{ fontSize: '12px', color: '#999', flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {payment.phone || t('pages.collections.phoneNotAvailable')}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <IonInput
                            type="number"
                            value={editedValues[payment.creditId] ?? payment.installmentValue}
                            placeholder={String(payment.installmentValue)}
                            onIonInput={(e: any) => {          // <-- troquei onIonChange por onIonInput
                              const value = e.detail.value === '' ? 0 : Number(e.detail.value);
                              setEditedValues(prev => ({ ...prev, [payment.creditId]: value }));
                            }}
                            style={{ textAlign: 'center', fontSize: '13px', height: '36px', width: '80px' }}
                          />
                          <IonButton
                            size="small"
                            onClick={() => handlePayment(payment)}
                            style={{
                              margin: 0, width: '36px', height: '36px', minWidth: '36px',
                              '--padding-start': '0', '--padding-end': '0',
                              '--background': debtColor, '--background-hover': debtColor, '--color': '#fff',
                              '--border-radius': '10px'
                            } as any}
                          >
                            <IonIcon icon={cashOutline} style={{ fontSize: '16px' }} />
                          </IonButton>
                        </div>
                      </div>

                      {payment.hasOverdueInstallments && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', backgroundColor: '#fff5f5', borderRadius: '8px' }}>
                          <IonIcon icon={warning} style={{ fontSize: '14px', color: '#dc3545', flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', color: '#dc3545', fontWeight: 600 }}>
                            {payment.overdueInstallmentsCount} {t('pages.collections.daysLate')} - {formatCurrencyWithSymbol(payment.accumulatedOverdueValue)} {t('pages.collections.accumulated')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={sentinelRef} style={{ height: '40px', textAlign: 'center', padding: '10px' }}>
                {isLoadingMore && <IonSpinner name="dots" />}
              </div>
            </>
          )}
        </div>

        {/* Modal de Detalhes do Cliente */}
        <IonModal isOpen={showClientModal} onDidDismiss={() => setShowClientModal(false)}>
          <GreenHeader
            title={t('pages.collections.clientInfo')}
            onClose={() => setShowClientModal(false)}
            onAction={(activeCreditId || selectedCredit?.id) ? openPaymentHistory : undefined}
            actionIcon={timeOutline}
          />
          <IonContent>
            {selectedClient && (
              <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#098947', borderRadius: '16px 0 0 16px' }} />
                  <div style={{ paddingLeft: '8px' }}>
                    <InfoRow label={t('pages.collections.name')} value={selectedClient.name} />
                    <InfoRow label={t('pages.collections.phone')} value={selectedClient.phone || t('pages.collections.notInformed')} />
                    <InfoRow label={t('pages.collections.address')} value={selectedClient.address || t('pages.collections.notInformed')} />
                    <InfoRow label={t('pages.collections.shop')} value={selectedClient.shop || t('pages.collections.notInformed')} />
                    <InfoRow label={t('pages.collections.cpf')} value={selectedClient.cpf || t('pages.collections.notInformed')} showBorder={false} />
                  </div>
                </div>

                {clientCredits.length > 0 && (() => {
                  const summary = calculateClientSummary(clientCredits);
                  return (
                    <>
                      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#6f42c1', borderRadius: '16px 0 0 16px' }} />
                        <div style={{ paddingLeft: '8px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#262626', marginBottom: '12px' }}>{t('pages.collections.debtSummary')}</div>
                          <InfoRow label={t('pages.collections.remainingInstallments')} value={`${summary.remainingInstallments} ${t('pages.collections.installments')}`} valueColor="#262626" />
                          <InfoRow label={t('pages.collections.remainingDebt')} value={formatCurrencyWithSymbol(summary.totalRemainingDebt)} />
                          <InfoRow label={t('pages.collections.totalDebtWithInterest')} value={formatCurrencyWithSymbol(summary.totalDebt)} showBorder={false} />
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#098947', borderRadius: '16px 0 0 16px' }} />
                        <div style={{ paddingLeft: '8px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#262626', marginBottom: '12px' }}>{t('pages.collections.debtDetails')}</div>
                          {clientCredits.map((credit, index) => {
                            const paidAmount = (credit.initialValue + (credit.initialValue * credit.tax / 100)) - credit.totalDebt;
                            const totalWithInterest = credit.initialValue + (credit.initialValue * credit.tax / 100);
                            const progressPercentage = totalWithInterest > 0 ? (paidAmount / totalWithInterest) * 100 : 0;
                            return (
                              <div key={credit.id} style={{ marginBottom: index < clientCredits.length - 1 ? '16px' : 0, paddingBottom: index < clientCredits.length - 1 ? '16px' : 0, borderBottom: index < clientCredits.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                <InfoRow label={t('pages.collections.debtStartDate')} value={formatToBrazilTime(credit.startDate)} />
                                <InfoRow label={t('pages.collections.debtInterestRate')} value={`${credit.tax}%`} />
                                <InfoRow label={t('pages.collections.debtInstallmentValue')} value={formatCurrencyWithSymbol(credit.dayValue)} />
                                {credit.totalDebt > 0 && (
                                  <InfoRow label={t('pages.collections.debtOverdueValue')} value={formatCurrencyWithSymbol(credit.totalDebt)} showBorder={false} />
                                )}
                                <div style={{ marginTop: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#555' }}>
                                    <span>{t('pages.collections.debtProgress')}</span>
                                    <span style={{ fontWeight: 600 }}>{Math.round(progressPercentage)}%</span>
                                  </div>
                                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: '#098947', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#888' }}>
                                    <span>{t('pages.collections.debtPaid')}: {formatCurrencyWithSymbol(paidAmount)}</span>
                                    <span>{t('pages.collections.debtRemaining')}: {formatCurrencyWithSymbol(credit.totalDebt)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Modal Histórico */}
        <IonModal isOpen={showHistoryModal} onDidDismiss={() => setShowHistoryModal(false)}>
          <GreenHeader title={t('pages.collections.paymentHistory')} onClose={() => setShowHistoryModal(false)} />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              {isHistoryLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><IonSpinner name="dots" /><p style={{ color: '#666', marginTop: '16px' }}>{t('pages.collections.loadingHistory')}</p></div>
              ) : creditHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}><p>{t('pages.collections.noPaymentHistory')}</p></div>
              ) : (
                creditHistory.map((entry) => (
                  <div key={`${entry.eventType}-${entry.id}-${entry.occurredAt}`} style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: entry.eventType === 'DEBIT_APPLIED' ? '#28a745' : '#dc3545', borderRadius: '14px 0 0 14px' }} />
                    <div style={{ paddingLeft: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#262626', marginBottom: '4px' }}>{getHistoryEventLabel(entry.eventType)}</div>
                          <div style={{ fontSize: '12px', color: '#888' }}>{formatHistoryDate(entry.occurredAt)}</div>
                          {entry.debitValue != null && (
                            <div style={{ fontSize: '14px', fontWeight: 700, color: entry.eventType === 'DEBIT_APPLIED' ? '#28a745' : '#dc3545', marginTop: '6px' }}>
                              {formatCurrencyWithSymbol(entry.debitValue)}
                            </div>
                          )}
                          {entry.totalDebt != null && (
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                              {t('pages.collections.historyRemainingDebt')}: {formatCurrencyWithSymbol(entry.totalDebt)}
                            </div>
                          )}
                        </div>
                        {entry.debitActive != null && (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: entry.debitActive ? '#28a745' : '#999', whiteSpace: 'nowrap' }}>
                            {entry.debitActive ? t('pages.collections.historyActive') : t('pages.collections.historyUndone')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Confirmação Pagamento */}
        <IonModal isOpen={showPaymentModal} onDidDismiss={closePaymentModal}>
          <GreenHeader title={t('pages.collections.confirmPaymentModalTitle')} onClose={closePaymentModal} />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#098947', borderRadius: '16px 0 0 16px' }} />
                <div style={{ paddingLeft: '8px' }}>
                  <p style={{ margin: '0 0 20px 0', color: '#555', lineHeight: 1.5, fontSize: '14px' }}>
                    {t('pages.collections.confirmPaymentModalMessage')
                      .replace('{value}', formatCurrencyWithSymbol(getPaymentValue()))
                      .replace('{clientName}', selectedPayment?.clientName || t('pages.collections.thisClient'))}
                  </p>
                  <PrimaryButton
                    onClick={() => confirmPayment(true)}
                    label={t('pages.collections.confirmAndShare')}
                    disabled={isProcessingPayment}
                    style={{ marginBottom: '10px' }}
                  />
                  <IonButton
                    expand="block"
                    fill="outline"
                    disabled={isProcessingPayment}
                    onClick={() => confirmPayment(false)}
                    style={{ '--border-radius': '12px', textTransform: 'none', fontWeight: 600, fontSize: '15px', '--padding-top': '14px', '--padding-bottom': '14px' } as any}
                  >
                    {t('pages.collections.confirm')}
                  </IonButton>
                  {isProcessingPayment && (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}><IonSpinner name="dots" /></div>
                  )}
                </div>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>

      {/* Rodapé - Total de Débitos de Hoje */}
      <div
        onClick={openTodayDebitsModal}
        style={{
          position: 'fixed', bottom: 0, left: 0, width: '100%',
          backgroundColor: '#fff', borderTop: '1px solid #e8e8e8',
          padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 12px))',
          zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxSizing: 'border-box', cursor: 'pointer', boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <span style={{ fontSize: '14px', color: '#555', fontWeight: 600 }}>
          {t('pages.collections.todayDebits')}
        </span>
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#098947' }}>
          {formatCurrencyWithSymbol(todayTotal)}
        </span>
      </div>

      {/* Modal Débitos de Hoje */}
      <IonModal isOpen={showTodayDebitsModal} onDidDismiss={() => setShowTodayDebitsModal(false)}>
        <GreenHeader title={t('pages.collections.todayDebits')} onClose={() => setShowTodayDebitsModal(false)} />
        <IonContent>
          <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
            <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '48px', marginBottom: '12px' } as any}>
              <IonIcon icon={searchOutline} slot="start" style={{ color: '#999' }} />
              <IonInput
                placeholder={t('common.searchPlaceholder')}
                key={todayDebitsSearchKey}
                onIonInput={(e: any) => setTodayDebitsSearchQuery(e.detail.value || '')}
                style={{ fontSize: '14px' }}
              />
              {todayDebitsSearchQuery && (
                <IonButton fill="clear" size="small" onClick={() => { setTodayDebitsSearchQuery(''); setTodayDebitsSearchKey(prev => prev + 1); }}>
                  <IonIcon icon={close} />
                </IonButton>
              )}
            </IonItem>

            {isLoadingTodayDebits ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><IonSpinner name="dots" /><p style={{ color: '#666', marginTop: '16px' }}>{t('pages.collections.loadingTodayDebits')}</p></div>
            ) : filteredTodayDebits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><p style={{ color: '#666' }}>{todayDebits.length === 0 ? t('pages.collections.noDebitsToday') : t('common.noSearchResults')}</p></div>
            ) : (
              filteredTodayDebits.map((debit) => (
                <div key={debit.id} style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px 18px', marginBottom: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', backgroundColor: '#098947', borderRadius: '14px 0 0 14px' }} />
                  <div style={{ paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#262626' }}>{debit.clientName}</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#098947', marginTop: '4px' }}>
                        {formatCurrencyWithSymbol(debit.value)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                        {formatToBrazilTime(debit.createdAt)}
                      </div>
                    </div>
                    <IonButton
                      size="small"
                      onClick={() => handleUndoFromModal(debit)}
                      style={{
                        margin: 0, width: '36px', height: '36px', minWidth: '36px',
                        '--padding-start': '0', '--padding-end': '0',
                        '--background': '#dc3545', '--background-hover': '#c82333', '--color': '#fff',
                        '--border-radius': '10px'
                      } as any}
                    >
                      <IonIcon icon={arrowUndo} style={{ fontSize: '16px' }} />
                    </IonButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </IonContent>
      </IonModal>

      <IonAlert
        isOpen={showUndoAlertModal}
        onDidDismiss={() => setShowUndoAlertModal(false)}
        header={t('pages.collected.undoCollection')}
        message={t('pages.collected.undoCollectionMessage').replace('{value}', formatCurrencyWithSymbol(selectedDebitModal?.value || 0)).replace('{clientName}', selectedDebitModal?.clientName || 'este cliente')}
        buttons={[
          { text: t('common.cancel'), role: 'cancel' },
          { text: t('pages.collected.undo'), handler: confirmUndoFromModal }
        ]}
      />

      <Toast isOpen={toast.isOpen} message={toast.message} color={toast.color}
        onDidDismiss={() => setToast({ ...toast, isOpen: false })} />
    </IonPage>
  );
};

export default Cobrancas;
