import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
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
import SelectInput from '../../components/ui/SelectInput';
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
        <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
          <IonTitle>{t('pages.transactions.title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => fetchTransactions(page, false)} disabled={loading} style={{ color: '#fff' }}>
              <IonIcon icon={refresh} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Filter card */}
        <div style={{
          margin: '16px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={calendar} style={{ fontSize: '18px', color: '#0c0989' }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                {t('pages.transactions.date')}
                {isToday && <span style={{ fontSize: '12px', fontWeight: '400', color: '#999', marginLeft: '4px' }}>({t('pages.transactions.today')})</span>}
              </span>
            </div>
            <input
              type="date"
              value={selectedDate}
              max={todayStr}
              onChange={e => {
                setSelectedDate(e.target.value || todayStr);
                setPage(0);
              }}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '13px',
                color: '#333',
                backgroundColor: '#f9f9f9',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'manager', 'route'] as FilterMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setFilterMode(mode); setPage(0); }}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: filterMode === mode ? '#0c0989' : '#f0f0f0',
                    color: filterMode === mode ? '#fff' : '#666',
                    transition: 'all 0.2s'
                  }}
                >
                  {mode === 'all' ? t('pages.transactions.filterAll') :
                   mode === 'manager' ? t('pages.transactions.filterManager') :
                   t('pages.transactions.filterRoute')}
                </button>
              ))}
            </div>
          </div>

          {filterMode === 'manager' && (
            <SelectInput
              label={t('pages.transactions.selectManager')}
              value={selectedManagerId ?? ''}
              options={managers}
              onChange={(val) => { setSelectedManagerId(val ? Number(val) : null); setPage(0); }}
              placeholder={t('pages.transactions.selectManager')}
            />
          )}

          {filterMode === 'route' && (
            <>
              <SelectInput
                label={t('pages.transactions.selectManager')}
                value={routeManagerId ?? ''}
                options={managers}
                onChange={(val) => {
                  const mgrId = val ? Number(val) : null;
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
                placeholder={t('pages.transactions.selectManager')}
              />
              {routeManagerId != null && (
                <SelectInput
                  label={t('pages.transactions.selectRoute')}
                  value={selectedRouteId ?? ''}
                  options={routes}
                  onChange={(val) => { setSelectedRouteId(val ? Number(val) : null); setPage(0); }}
                  placeholder={t('pages.transactions.selectRoute')}
                />
              )}
            </>
          )}

          {lastUpdate && (
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: '#aaa' }}>
                {t('pages.transactions.lastUpdate')}: {lastUpdate}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div style={{ margin: '0 16px 16px', padding: '12px 16px', backgroundColor: '#fff0f0', borderRadius: '12px', borderLeft: '4px solid #eb445a' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#eb445a' }}>{error}</p>
          </div>
        )}

        {/* Transactions list */}
        <div style={{ padding: '0 16px 16px' }}>
          {transactions.length === 0 && !loading && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#fff',
              borderRadius: '16px'
            }}>
              <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>{t('pages.transactions.empty')}</p>
            </div>
          )}
          {transactions.map(tx => (
            <div key={tx.id || tx.transactionId} style={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '10px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#262626' }}>
                  {formatTxType(tx.transactionType)}
                </span>
                <span style={{
                  fontSize: '15px',
                  fontWeight: '800',
                  color: tx.amount >= 0 ? '#0c0989' : '#eb445a'
                }}>
                  {tx.amount >= 0 ? '+' : ''}{formatCurrencyWithSymbol(tx.amount)}
                </span>
              </div>
              {tx.description && (
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#666' }}>{tx.description}</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                <span>{tx.performedByName} · {translateRole(tx.performedByRole, t)}</span>
                <span>{tx.routeName || ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f0f0f0' }}>
                <span>
                  {t('pages.transactions.balanceBefore')}: {formatCurrencyWithSymbol(tx.balanceBefore)} → {t('pages.transactions.balanceAfter')}: {formatCurrencyWithSymbol(tx.balanceAfter)}
                </span>
                <span>{formatToBrazilTime(tx.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {!isToday && totalPages > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', gap: '16px' }}>
            <button
              disabled={!canPrev}
              onClick={() => goToPage(page - 1)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '10px',
                backgroundColor: canPrev ? '#0c0989' : '#e0e0e0',
                color: canPrev ? '#fff' : '#999',
                fontSize: '14px',
                fontWeight: '600',
                cursor: canPrev ? 'pointer' : 'default'
              }}
            >
              <IonIcon icon={chevronBack} style={{ marginRight: '4px' }} />
              {t('pages.transactions.previous')}
            </button>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>
              {page + 1} {t('pages.transactions.of')} {totalPages}
            </span>
            <button
              disabled={!canNext}
              onClick={() => goToPage(page + 1)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '10px',
                backgroundColor: canNext ? '#0c0989' : '#e0e0e0',
                color: canNext ? '#fff' : '#999',
                fontSize: '14px',
                fontWeight: '600',
                cursor: canNext ? 'pointer' : 'default'
              }}
            >
              {t('pages.transactions.next')}
              <IonIcon icon={chevronForward} style={{ marginLeft: '4px' }} />
            </button>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Transactions;
