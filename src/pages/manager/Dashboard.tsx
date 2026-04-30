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
  IonSelect,
  IonSelectOption,
  IonModal,
  IonButtons,
  IonIcon,
  IonSpinner,
  IonDatetime,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonCheckbox
} from '@ionic/react';
import { close, analytics } from 'ionicons/icons';
import { getRoutes } from '../../services/routeApi';
import { getCurrentUser, apiRequest } from '../../services/api';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import { formatCurrencyWithSymbol } from '../../utils/currency';

interface Route {
  id: number;
  name: string;
}

interface Dashboard2Response {
  success: boolean;
  message: string;
  data: {
    message: string;
    routeReports: Array<{
      routeId: number;
      routeName: string;
      dailyCollectionCount: number;
      totalCollectionExpectation: number;
      totalCollectedAmount: number;
      totalDailyExpenses: number;
      totalDailyBalance: number;
      totalClientsPaid: number;
      totalCreditsCreatedCount: number;
      totalCreditsCreatedAmount: number;
    }>;
  };
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [timePeriod, setTimePeriod] = useState<string>('LAST_30_DAYS');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDateFromModal, setShowDateFromModal] = useState(false);
  const [showDateToModal, setShowDateToModal] = useState(false);
  const [showRoutesModal, setShowRoutesModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<Dashboard2Response | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useDateRange, setUseDateRange] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  // Carregar rotas da API
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const response = await getRoutes();
      console.log('Resposta da API getRoutes:', response);
      
      // Pega o usuário logado para filtrar as rotas
      const currentUser = getCurrentUser();
      console.log('Usuário logado:', currentUser);
      
      // Se a resposta tiver a estrutura { success, data }, extrai os dados
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = response.data;
      }
      
      // Filtra apenas as rotas que pertencem ao manager logado
      let filteredRoutes = [];
      if (Array.isArray(data)) {
        if (currentUser && currentUser.id) {
          filteredRoutes = data.filter(route => route.adminId === currentUser.id);
        } else {
          filteredRoutes = data; // Se não conseguir pegar o ID, mostra todas
        }
      }
      
      setRoutes(filteredRoutes);
      console.log('Rotas filtradas para o manager:', filteredRoutes);
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
      showToast(t('pages.dashboard.errorLoadingRoutes'), 'danger');
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const timePeriods = [
    { value: 'LAST_7_DAYS', label: t('pages.dashboard.last7Days') },
    { value: 'LAST_30_DAYS', label: t('pages.dashboard.last30Days') },
    { value: 'LAST_60_DAYS', label: t('pages.dashboard.last60Days') },
    { value: 'LAST_90_DAYS', label: t('pages.dashboard.last90Days') },
    { value: 'ALL_TIME', label: t('pages.dashboard.allTime') }
  ];

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handleRouteToggle = (routeId: number) => {
    setSelectedRoutes(prev => 
      prev.includes(routeId) 
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  const handleGenerateDashboard = async () => {
    showToast(t('pages.dashboard.featureInDevelopment'), 'warning');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

  const formatPercentage = (value: number) =>
    `${value.toFixed(1)}%`;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.dashboard.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px' }}>

          {/* Filtros Centralizados */}
          <IonCard style={{ borderRadius: '12px', marginBottom: '20px' }}>
            <IonCardHeader>
              <IonCardTitle>{t('pages.dashboard.filters')}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {/* Tipo de Filtro de Período */}
              <IonItem style={{ marginTop: '16px' }}>
                <IonLabel position="stacked">{t('pages.dashboard.periodFilterType')}</IonLabel>
                <IonSelect
                  value={useDateRange ? 'custom' : 'predefined'}
                  placeholder={t('pages.dashboard.selectType')}
                  onIonChange={e => setUseDateRange(e.detail.value === 'custom')}
                >
                  <IonSelectOption value="predefined">{t('pages.dashboard.predefinedPeriod')}</IonSelectOption>
                  <IonSelectOption value="custom">{t('pages.dashboard.customInterval')}</IonSelectOption>
                </IonSelect>
              </IonItem>

              {/* Período Predefinido */}
              {!useDateRange && (
                <IonItem style={{ marginTop: '16px' }}>
                  <IonLabel position="stacked">{t('pages.dashboard.period')}</IonLabel>
                  <IonSelect
                    value={timePeriod}
                    placeholder={t('pages.dashboard.selectPeriod')}
                    onIonChange={e => setTimePeriod(e.detail.value)}
                  >
                    {timePeriods.map(period => (
                      <IonSelectOption key={period.value} value={period.value}>
                        {period.label}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              )}

              {/* Intervalo Personalizado */}
              {useDateRange && (
                <>
                  <IonItem style={{ marginTop: '16px' }}>
                    <IonLabel position="stacked">{t('pages.dashboard.startDate')}</IonLabel>
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={() => setShowDateFromModal(true)}
                    >
                      {dateFrom ? new Date(dateFrom).toLocaleDateString('pt-BR') : t('pages.dashboard.selectDate')}
                    </IonButton>
                  </IonItem>
                  <IonItem style={{ marginTop: '16px' }}>
                    <IonLabel position="stacked">{t('pages.dashboard.endDate')}</IonLabel>
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={() => setShowDateToModal(true)}
                    >
                      {dateTo ? new Date(dateTo).toLocaleDateString('pt-BR') : t('pages.dashboard.selectDate')}
                    </IonButton>
                  </IonItem>
                </>
              )}

              {/* Seleção de Rotas */}
              <IonItem style={{ marginTop: '16px' }}>
                <IonLabel position="stacked">{t('pages.dashboard.filterRoutes')}</IonLabel>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setShowRoutesModal(true)}
                >
                  {selectedRoutes.length > 0 ? `${selectedRoutes.length} ${t('pages.dashboard.routeSelected')} ${t('pages.dashboard.routesSelected')}` : t('pages.dashboard.allRoutes')}
                </IonButton>
              </IonItem>

              {/* Botão Gerar Dashboard */}
              <IonButton
                expand="block"
                onClick={handleGenerateDashboard}
                disabled={isLoading}
                style={{ marginTop: '20px' }}
              >
                {isLoading ? <IonSpinner name="dots" /> : t('pages.dashboard.generateDashboard')}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Modal Data Inicial */}
        <IonModal isOpen={showDateFromModal} onDidDismiss={() => setShowDateFromModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.dashboard.selectStartDate')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDateFromModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonDatetime
                presentation="date"
                value={dateFrom}
                onIonChange={e => setDateFrom(e.detail.value as string)}
              />
              <IonButton
                expand="block"
                onClick={() => setShowDateFromModal(false)}
                style={{ marginTop: '16px' }}
              >
                {t('pages.dashboard.confirm')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Data Final */}
        <IonModal isOpen={showDateToModal} onDidDismiss={() => setShowDateToModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.dashboard.selectEndDate')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDateToModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonDatetime
                presentation="date"
                value={dateTo}
                onIonChange={e => setDateTo(e.detail.value as string)}
              />
              <IonButton
                expand="block"
                onClick={() => setShowDateToModal(false)}
                style={{ marginTop: '16px' }}
              >
                {t('pages.dashboard.confirm')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Seleção de Rotas */}
        <IonModal isOpen={showRoutesModal} onDidDismiss={() => setShowRoutesModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.dashboard.selectRoutes')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowRoutesModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonLabel>
                <h2>{t('pages.dashboard.availableRoutes')}</h2>
                <p>{t('pages.dashboard.selectRoutesDescription')}</p>
              </IonLabel>
              
              <IonList>
                {isLoadingRoutes ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <IonSpinner name="dots" />
                    <p>{t('pages.dashboard.loadingRoutes')}</p>
                  </div>
                ) : routes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p>{t('pages.dashboard.noRoutesFound')}</p>
                  </div>
                ) : (
                  routes.map(route => (
                    <IonItem key={route.id}>
                      <IonLabel>{route.name}</IonLabel>
                      <IonCheckbox
                        slot="end"
                        checked={selectedRoutes.includes(route.id)}
                        onIonChange={() => handleRouteToggle(route.id)}
                      />
                    </IonItem>
                  ))
                )}
              </IonList>
              
              <IonButton
                expand="block"
                onClick={() => setShowRoutesModal(false)}
                style={{ marginTop: '20px' }}
              >
                {t('pages.dashboard.apply')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Relatório */}
        <IonModal isOpen={showReportModal} onDidDismiss={() => setShowReportModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.dashboard.generatedDashboard')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowReportModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {dashboardData?.data && (
              <div style={{ padding: '16px' }}>
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>{t('pages.dashboard.generalSummary')}</IonCardTitle>
                    <IonLabel>
                      <p>{t('pages.dashboard.generatedAt')}: {new Date().toLocaleString('pt-BR')}</p>
                    </IonLabel>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        <IonCol>
                          <h3>{formatCurrency(
                            dashboardData.data.routeReports.reduce((sum, route) => sum + route.totalCollectedAmount, 0)
                          )}</h3>
                          <p>{t('pages.dashboard.totalCollected')}</p>
                        </IonCol>
                        <IonCol>
                          <h3>{formatCurrency(
                            dashboardData.data.routeReports.reduce((sum, route) => sum + route.totalDailyExpenses, 0)
                          )}</h3>
                          <p>{t('pages.dashboard.totalExpenses')}</p>
                        </IonCol>
                        <IonCol>
                          <h3>{formatCurrency(
                            dashboardData.data.routeReports.reduce((sum, route) => sum + route.totalDailyBalance, 0)
                          )}</h3>
                          <p>{t('pages.dashboard.netBalance')}</p>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>

                <IonCard style={{ marginTop: '20px' }}>
                  <IonCardHeader>
                    <IonCardTitle>{t('pages.dashboard.dataByRoute')}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {dashboardData.data.routeReports.length === 0 ? (
                      <p>{t('pages.dashboard.noDetailedDataFound')}</p>
                    ) : (
                      dashboardData.data.routeReports.map(route => (
                        <IonItem key={route.routeId}>
                          <IonLabel>
                            <h3>{route.routeName}</h3>
                            <p>{t('pages.dashboard.collected')}: {formatCurrency(route.totalCollectedAmount)}</p>
                            <p>{t('pages.dashboard.balance')}: {formatCurrency(route.totalDailyBalance)}</p>
                          </IonLabel>
                        </IonItem>
                      ))
                    )}
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
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
