import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonDatetime,
  IonIcon,
  IonButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { refresh, calendar, close } from 'ionicons/icons';
import {
  getCategorias,
  getDetalhesGastos,
  CategoriaGasto,
  CategoriaDetalhesResponse,
  DetalhesRequest
} from '../../services/gastoApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import GreenHeader from '../../components/ui/GreenHeader';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ModernCard from '../../components/ui/ModernCard';
import InfoRow from '../../components/ui/InfoRow';

const DetalhesGastos: React.FC = () => {
  const { t } = useTranslation();
  const { categoriaId } = useParams<{ categoriaId: string }>();
  const history = useHistory();

  const [categoria, setCategoria] = useState<CategoriaGasto | null>(null);
  const [detalhes, setDetalhes] = useState<CategoriaDetalhesResponse | null>(null);
  const [periodo, setPeriodo] = useState<
    'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_60_DAYS' | 'LAST_90_DAYS' | 'ALL_TIME' | 'custom'
  >('LAST_30_DAYS');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; color: string }>({
    isOpen: false,
    message: '',
    color: ''
  });

  useEffect(() => {
    loadCategoria();
  }, [categoriaId]);

  const loadCategoria = async () => {
    try {
      const data = await getCategorias();
      const cat = data.find((c: CategoriaGasto) => c.id === Number(categoriaId));
      setCategoria(cat || null);
    } catch {
      showToast(t('pages.expensesDetails.errorLoadingCategory'), 'danger');
    }
  };

  const loadDetalhes = async () => {
    setIsLoading(true);
    try {
      const request: DetalhesRequest = {};
      
      if (periodo === 'custom') {
        if (dataInicio && dataFim) {
          request.dateFrom = new Date(dataInicio).toISOString();
          request.dateTo = new Date(dataFim).toISOString();
        } else {
          showToast(t('pages.expensesDetails.errorSelectValidPeriod'), 'danger');
          return;
        }
      } else {
        request.timePeriod = periodo as any;
      }
      
      const data = await getDetalhesGastos(Number(categoriaId), request);
      setDetalhes(data);
    } catch {
      showToast(t('pages.expensesDetails.errorLoadingDetails'), 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handlePeriodoChange = (value: string) => {
    if (value === 'custom') {
      setPeriodo('custom');
      setShowCalendarModal(true);
    } else {
      setPeriodo(value as any);
      setDataInicio('');
      setDataFim('');
    }
  };

  const handleCustomPeriodApply = () => {
    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      
      if (inicio >= fim) {
        showToast(t('pages.expensesDetails.errorStartBeforeEnd'), 'danger');
        return;
      }
      
      setShowCalendarModal(false);
      loadDetalhes();
    } else {
      showToast(t('pages.expensesDetails.errorFillBothDates'), 'danger');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
          <IonTitle>{t('pages.expensesDetails.title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/manager/gastos')} style={{ color: '#fff' }}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async event => {
            await Promise.all([loadCategoria(), loadDetalhes()]);
            event.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          <ModernCard headerTitle={t('pages.expensesDetails.selectPeriod')} headerIcon={calendar}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>
                {t('pages.expensesDetails.period')}
              </span>
              <IonItem style={{
                '--background': '#f5f5f5',
                '--border-radius': '12px',
                '--padding-start': '16px',
                '--inner-padding-end': '16px',
                '--min-height': '52px',
                marginBottom: '8px'
              }}>
                <IonLabel style={{ fontWeight: 600, fontSize: '13px', color: '#555', minWidth: '80px' }}>
                  {t('pages.expensesDetails.period')}
                </IonLabel>
                <IonSelect
                  value={periodo}
                  placeholder={t('pages.expensesDetails.selectPeriodPlaceholder')}
                  onIonChange={e => handlePeriodoChange(e.detail.value)}
                  interface="popover"
                >
                  <IonSelectOption value="TODAY">{t('pages.expensesDetails.today')}</IonSelectOption>
                  <IonSelectOption value="LAST_7_DAYS">{t('pages.expensesDetails.last7Days')}</IonSelectOption>
                  <IonSelectOption value="LAST_30_DAYS">{t('pages.expensesDetails.last30Days')}</IonSelectOption>
                  <IonSelectOption value="LAST_60_DAYS">{t('pages.expensesDetails.last60Days')}</IonSelectOption>
                  <IonSelectOption value="LAST_90_DAYS">{t('pages.expensesDetails.last90Days')}</IonSelectOption>
                  <IonSelectOption value="ALL_TIME">{t('pages.expensesDetails.allTime')}</IonSelectOption>
                  <IonSelectOption value="custom">{t('pages.expensesDetails.customPeriod')}</IonSelectOption>
                </IonSelect>
              </IonItem>
            </div>
            <PrimaryButton
              onClick={loadDetalhes}
              label={t('pages.expensesDetails.filter')}
              icon={refresh}
              disabled={isLoading}
            />
          </ModernCard>

          {categoria && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#0c0989',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                  {categoria.name}
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <InfoRow
                  label={t('pages.expensesDetails.totalExpenses')}
                  value={formatCurrency(detalhes?.totalAmount || 0)}
                  valueColor="#dc3545"
                />
              </div>
            </div>
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#999', fontSize: '14px' }}>{t('pages.expensesDetails.loading')}</p>
            </div>
          ) : detalhes?.expenseTypes?.length ? (
            detalhes.expenseTypes.map((expenseType: any, index: number) => (
              <div key={index} style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                marginBottom: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#262626' }}>
                    {expenseType.typeName}
                  </h3>
                </div>
                <div style={{ padding: '12px 20px' }}>
                  <InfoRow
                    label={t('pages.expensesDetails.quantity')}
                    value={expenseType.expenseCount.toString()}
                  />
                  <InfoRow
                    label={t('pages.expensesDetails.totalValue')}
                    value={formatCurrency(expenseType.totalAmount)}
                    valueColor="#dc3545"
                  />
                  <InfoRow
                    label={t('pages.expensesDetails.averageValue')}
                    value={formatCurrency(expenseType.totalAmount / expenseType.expenseCount)}
                    showBorder={false}
                  />
                </div>
              </div>
            ))
          ) : (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <p style={{ color: '#999', margin: 0, fontSize: '14px' }}>
                {t('pages.expensesDetails.noExpensesFound')}
              </p>
            </div>
          )}
        </div>

        <IonModal isOpen={showCalendarModal} onDidDismiss={() => setShowCalendarModal(false)}>
          <GreenHeader
            title={t('pages.expensesDetails.customPeriodTitle')}
            onClose={() => setShowCalendarModal(false)}
          />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>
                  {t('pages.expensesDetails.startDate')}
                </span>
                <IonDatetime
                  presentation="date"
                  value={dataInicio}
                  onIonChange={e => setDataInicio(e.detail.value as string)}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>
                  {t('pages.expensesDetails.endDate')}
                </span>
                <IonDatetime
                  presentation="date"
                  value={dataFim}
                  onIonChange={e => setDataFim(e.detail.value as string)}
                />
              </div>
              <PrimaryButton
                onClick={handleCustomPeriodApply}
                label={t('pages.expensesDetails.applyPeriod')}
                disabled={!dataInicio || !dataFim}
              />
            </div>
          </IonContent>
        </IonModal>

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

export default DetalhesGastos;
