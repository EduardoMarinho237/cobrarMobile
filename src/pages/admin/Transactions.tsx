import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonText,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
} from '@ionic/react';
import { refresh,chevronBack,chevronForward,calendar } from 'ionicons/icons';
import { getAdminTransactions, TransactionPage, Transaction } from '../../services/transactionApi';
import { getManagers } from '../../services/api';
import { getRoutesByManager } from '../../services/routeApi';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import { formatToBrazilTime } from '../../utils/dateFormat';
import { translateRole } from '../../utils/roleTranslation';
import { useTranslation } from 'react-i18next';

interface ManagerOption {
  id: number;
  name: string;
}

interface RouteOption {
  id: number;
  name: string;
}

type FilterMode = 'all' | 'manager' | 'route';

const Transactions: React.FC = () => {
  const { t } = useTranslation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<TransactionPage | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [routeManagerId, setRouteManagerId] = useState<number | null>(null);
  const dateInputRef = useRef<HTMLIonInputElement>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isToday = selectedDate === todayStr;

  const fetchTransactions = useCallback(async (currentPage: number, append: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page: isToday ? 0 : currentPage, size: isToday ? 99999 : 50, date: selectedDate };
      if (filterMode === 'manager' && selectedManagerId != null) {
        params.tenantId = selectedManagerId;
      } else if (filterMode === 'route' && selectedRouteId != null) {
        params.routeId = selectedRouteId;
        params.tenantId = routeManagerId;
      }
      const result = await getAdminTransactions(params);
      if (result) {
        setData(result);
        setTransactions(append ? prev => [...prev, ...result.content] : result.content);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        if (!append) setTransactions([]);
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  }, [filterMode, selectedManagerId, selectedRouteId, selectedDate]);

  useEffect(() => {
    setPage(0);
    fetchTransactions(0, false);
  }, [fetchTransactions]);

  const startAutoRefresh = useCallback(() => {
    stopAutoRefresh();
    intervalRef.current = setInterval(() => {
      fetchTransactions(page, false);
    }, 20000);
  }, [fetchTransactions, page]);

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startAutoRefresh();
    return stopAutoRefresh;
  }, [startAutoRefresh]);

  useEffect(() => {
    getManagers().then((res: any) => {
      if (Array.isArray(res)) {
        setManagers(res.filter((m: any) => m.role === 'MANAGER').map((m: any) => ({ id: m.id, name: m.name })));
      } else if (res?.data && Array.isArray(res.data)) {
        setManagers(res.data.filter((m: any) => m.role === 'MANAGER').map((m: any) => ({ id: m.id, name: m.name })));
      }
    }).catch(() => {});
  }, []);

  const handleRefresh = async (e: CustomEvent) => {
    await fetchTransactions(0, false);
    e.detail.complete();
  };

  const totalPages = data?.totalPages ?? 0;
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const goToPage = (newPage: number) => {
    setPage(newPage);
    fetchTransactions(newPage, false);
  };

  const formatTxType = (type: string): string => {
    const key = `pages.transactions.types.${type}`;
    const translated = t(key);
    return translated !== key ? translated : type;
  };

  const getAmountColor = (amount: number): string => {
    if (amount > 0) return 'success';
    if (amount < 0) return 'danger';
    return 'medium';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.transactions.title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => fetchTransactions(page, false)} disabled={loading}>
              <IonIcon icon={refresh} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonList>
          <IonItem>
            <IonIcon icon={calendar} slot="start" />
            <IonLabel>
              {t('pages.transactions.date')}
              {isToday && <span style={{ fontSize: '0.75em', opacity: 0.7 }}> ({t('pages.transactions.today')})</span>}
            </IonLabel>
            <IonInput
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              max={todayStr}
              onIonChange={e => {
                setSelectedDate(e.detail.value || todayStr);
                setPage(0);
              }}
              style={{ textAlign: 'right' }}
            />
          </IonItem>

          <IonItem>
            <IonLabel>{t('pages.transactions.filter')}</IonLabel>
            <IonSelect value={filterMode} onIonChange={e => { setFilterMode(e.detail.value); setPage(0); }}
              interface="popover">
              <IonSelectOption value="all">{t('pages.transactions.filterAll')}</IonSelectOption>
              <IonSelectOption value="manager">{t('pages.transactions.filterManager')}</IonSelectOption>
              <IonSelectOption value="route">{t('pages.transactions.filterRoute')}</IonSelectOption>
            </IonSelect>
          </IonItem>

          {filterMode === 'manager' && (
            <IonItem>
              <IonLabel>{t('pages.transactions.manager')}</IonLabel>
              <IonSelect value={selectedManagerId} onIonChange={e => { setSelectedManagerId(e.detail.value); setPage(0); }}
                interface="popover" placeholder={t('pages.transactions.selectManager')}>
                {managers.map(m => (
                  <IonSelectOption key={m.id} value={m.id}>{m.name}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          )}

          {filterMode === 'route' && (
            <>
              <IonItem>
                <IonLabel>{t('pages.transactions.manager')}</IonLabel>
                <IonSelect value={routeManagerId} onIonChange={e => {
                  const mgrId = e.detail.value as number | null;
                  setRouteManagerId(mgrId);
                  setSelectedRouteId(null);
                  setPage(0);
                  if (mgrId != null) {
                    getRoutesByManager(mgrId).then((res: any) => {
                      const list = Array.isArray(res) ? res : (res?.data || []);
                      setRoutes(list.filter((r: any) => r.role === 'ROUTE' || r.adminId === mgrId).map((r: any) => ({ id: r.id, name: r.name })));
                    }).catch(() => {});
                  } else {
                    setRoutes([]);
                  }
                }}
                  interface="popover" placeholder={t('pages.transactions.selectManager')}>
                  {managers.map(m => (
                    <IonSelectOption key={m.id} value={m.id}>{m.name}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              {routeManagerId != null && (
                <IonItem>
                  <IonLabel>{t('pages.transactions.route')}</IonLabel>
                  <IonSelect value={selectedRouteId} onIonChange={e => { setSelectedRouteId(e.detail.value); setPage(0); }}
                    interface="popover" placeholder={t('pages.transactions.selectRoute')}>
                    {routes.map(r => (
                      <IonSelectOption key={r.id} value={r.id}>{r.name}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              )}
            </>
          )}

          {lastUpdate && (
            <IonItem lines="none">
              <IonNote slot="end" style={{ fontSize: '0.75rem' }}>
                {t('pages.transactions.lastUpdate')}: {lastUpdate}
              </IonNote>
            </IonItem>
          )}
        </IonList>

        {error && (
          <IonText color="danger" className="ion-padding">
            <p>{error}</p>
          </IonText>
        )}

        <IonList>
          {transactions.length === 0 && !loading && (
            <IonItem>
              <IonLabel className="ion-text-center">
                <IonText color="medium">{t('pages.transactions.empty')}</IonText>
              </IonLabel>
            </IonItem>
          )}
          {transactions.map(tx => (
            <IonItem key={tx.id || tx.transactionId} detail={false}>
              <IonLabel className="ion-text-wrap">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonText>
                    <strong>{formatTxType(tx.transactionType)}</strong>
                  </IonText>
                  <IonBadge color={getAmountColor(tx.amount)}>
                    {formatCurrencyWithSymbol(Math.abs(tx.amount))}
                  </IonBadge>
                </div>
                <p>{tx.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <IonNote>{tx.performedByName} ({translateRole(tx.performedByRole, t)})</IonNote>
                  <IonNote>{tx.routeName && `${t('pages.transactions.route')}: ${tx.routeName}`}</IonNote>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  <IonNote color="medium">
                    {t('pages.transactions.balanceBefore')}: {formatCurrencyWithSymbol(tx.balanceBefore)} | 
                    {t('pages.transactions.balanceAfter')}: {formatCurrencyWithSymbol(tx.balanceAfter)}
                  </IonNote>
                  <IonNote color="medium">{formatToBrazilTime(tx.createdAt)}</IonNote>
                </div>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>

        {!isToday && totalPages > 0 && (
          <IonGrid>
            <IonRow className="ion-justify-content-center ion-align-items-center">
              <IonCol size="auto">
                <IonButtons>
                  <IonButton disabled={!canPrev} onClick={() => goToPage(page - 1)}>
                    <IonIcon icon={chevronBack} slot="icon-only" />
                  </IonButton>
                  <IonLabel className="ion-padding-horizontal">
                    {t('pages.transactions.page')} {page + 1} {t('pages.transactions.of')} {totalPages}
                  </IonLabel>
                  <IonButton disabled={!canNext} onClick={() => goToPage(page + 1)}>
                    <IonIcon icon={chevronForward} slot="icon-only" />
                  </IonButton>
                </IonButtons>
              </IonCol>
            </IonRow>
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Transactions;
