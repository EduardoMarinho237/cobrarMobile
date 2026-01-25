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
    IonCheckbox,
    IonDatetime,
    IonList,
    IonGrid,
    IonRow,
    IonCol
  } from '@ionic/react';
  import { close, analytics } from 'ionicons/icons';
  import { generateDashboard, DashboardRequest, DashboardResponse } from '../../services/gastoApi';
  import { getRoutes } from '../../services/routeApi';
  import { getCurrentUser } from '../../services/api';
  import Toast from '../../components/Toast';

  interface Route {
    id: number;
    name: string;
  }

  const Dashboard: React.FC = () => {
    const [dashboardType, setDashboardType] = useState<DashboardRequest['dashboardType']>('TOTAL');
    const [timePeriod, setTimePeriod] = useState<DashboardRequest['timePeriod']>('LAST_30_DAYS');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
    const [detail, setDetail] = useState<boolean>(true);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showDateFromModal, setShowDateFromModal] = useState(false);
    const [showDateToModal, setShowDateToModal] = useState(false);
    const [showRoutesModal, setShowRoutesModal] = useState(false);
    const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
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
        showToast('Erro ao carregar rotas', 'danger');
      } finally {
        setIsLoadingRoutes(false);
      }
    };

    const dashboardTypes = [
      { value: 'TOTAL', label: 'Total' },
      { value: 'EXPENSES', label: 'Gastos' },
      { value: 'CLIENTS', label: 'Clientes' },
      { value: 'CREDITS_DEBITS', label: 'Créditos/Débitos' },
      { value: 'CATEGORIES', label: 'Categorias' },
      { value: 'TYPES', label: 'Tipos' }
    ];

    const timePeriods = [
      { value: 'TODAY', label: 'Hoje' },
      { value: 'LAST_7_DAYS', label: 'Últimos 7 dias' },
      { value: 'LAST_30_DAYS', label: 'Últimos 30 dias' },
      { value: 'LAST_60_DAYS', label: 'Últimos 60 dias' },
      { value: 'LAST_90_DAYS', label: 'Últimos 90 dias' },
      { value: 'ALL_TIME', label: 'Todo o período' }
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
      // Validações
      if (useDateRange && (!dateFrom || !dateTo)) {
        showToast('Preencha ambas as datas para o intervalo personalizado', 'danger');
        return;
      }

      if (useDateRange && dateFrom && dateTo) {
        const from = new Date(dateFrom);
        const to = new Date(dateTo);
        if (from >= to) {
          showToast('A data inicial deve ser anterior à data final', 'danger');
          return;
        }
      }

      setIsLoading(true);
      try {
        const request: DashboardRequest = {
          dashboardType,
          detail,
          routeIds: selectedRoutes.length > 0 ? selectedRoutes : undefined
        };

        if (useDateRange) {
          request.dateFrom = new Date(dateFrom).toISOString();
          request.dateTo = new Date(dateTo).toISOString();
        } else {
          request.timePeriod = timePeriod;
        }

        const data = await generateDashboard(request);
        
        // Corrigir dados que vêm como strings
        if (data) {
          // Converter strings JSON para arrays
          if (typeof data.routesData === 'string') {
            try {
              data.routesData = JSON.parse(data.routesData);
            } catch (e) {
              data.routesData = [];
            }
          }
          if (typeof data.categoriesData === 'string') {
            try {
              data.categoriesData = JSON.parse(data.categoriesData);
            } catch (e) {
              data.categoriesData = [];
            }
          }
          if (typeof data.typesData === 'string') {
            try {
              data.typesData = JSON.parse(data.typesData);
            } catch (e) {
              data.typesData = [];
            }
          }
          if (typeof data.clientsData === 'string') {
            try {
              data.clientsData = JSON.parse(data.clientsData);
            } catch (e) {
              data.clientsData = [];
            }
          }
          if (typeof data.creditsDebitsData === 'string') {
            try {
              data.creditsDebitsData = JSON.parse(data.creditsDebitsData);
            } catch (e) {
              data.creditsDebitsData = [];
            }
          }
          if (typeof data.dailyData === 'string') {
            try {
              data.dailyData = JSON.parse(data.dailyData);
            } catch (e) {
              data.dailyData = [];
            }
          }
          if (typeof data.monthlyData === 'string') {
            try {
              data.monthlyData = JSON.parse(data.monthlyData);
            } catch (e) {
              data.monthlyData = [];
            }
          }
          if (typeof data.yearlyData === 'string') {
            try {
              data.yearlyData = JSON.parse(data.yearlyData);
            } catch (e) {
              data.yearlyData = [];
            }
          }
        }
        
        setDashboardData(data);
        setShowReportModal(true);
        showToast('Dashboard gerado com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao gerar dashboard:', error);
        showToast('Erro ao gerar dashboard', 'danger');
      } finally {
        setIsLoading(false);
      }
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
            <IonTitle>Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div style={{ padding: '16px' }}>

            {/* Filtros Centralizados */}
            <IonCard style={{ borderRadius: '12px', marginBottom: '20px' }}>
              <IonCardHeader>
                <IonCardTitle>Filtros do Dashboard</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {/* Tipo de Dashboard */}
                <IonItem>
                  <IonLabel position="stacked">Tipo de Dashboard</IonLabel>
                  <IonSelect
                    value={dashboardType}
                    placeholder="Selecione o tipo"
                    onIonChange={e => setDashboardType(e.detail.value)}
                  >
                    {dashboardTypes.map(type => (
                      <IonSelectOption key={type.value} value={type.value}>
                        {type.label}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

                {/* Tipo de Filtro de Período */}
                <IonItem style={{ marginTop: '16px' }}>
                  <IonLabel position="stacked">Tipo de Filtro de Período</IonLabel>
                  <IonSelect
                    value={useDateRange ? 'custom' : 'predefined'}
                    placeholder="Selecione o tipo"
                    onIonChange={e => setUseDateRange(e.detail.value === 'custom')}
                  >
                    <IonSelectOption value="predefined">Período Predefinido</IonSelectOption>
                    <IonSelectOption value="custom">Intervalo Personalizado</IonSelectOption>
                  </IonSelect>
                </IonItem>

                {/* Período Predefinido */}
                {!useDateRange && (
                  <IonItem style={{ marginTop: '16px' }}>
                    <IonLabel position="stacked">Período</IonLabel>
                    <IonSelect
                      value={timePeriod}
                      placeholder="Selecione o período"
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
                      <IonLabel position="stacked">Data Inicial</IonLabel>
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={() => setShowDateFromModal(true)}
                      >
                        {dateFrom ? new Date(dateFrom).toLocaleDateString('pt-BR') : 'Selecionar Data'}
                      </IonButton>
                    </IonItem>
                    <IonItem style={{ marginTop: '16px' }}>
                      <IonLabel position="stacked">Data Final</IonLabel>
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={() => setShowDateToModal(true)}
                      >
                        {dateTo ? new Date(dateTo).toLocaleDateString('pt-BR') : 'Selecionar Data'}
                      </IonButton>
                    </IonItem>
                  </>
                )}

                {/* Nível de Detalhe */}
                <IonItem style={{ marginTop: '16px' }}>
                  <IonLabel>Nível de Detalhe</IonLabel>
                  <IonCheckbox
                    slot="end"
                    checked={detail}
                    onIonChange={e => setDetail(e.detail.checked)}
                  />
                </IonItem>

                {/* Seleção de Rotas */}
                <IonItem style={{ marginTop: '16px' }}>
                  <IonLabel position="stacked">Filtrar Rotas</IonLabel>
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() => setShowRoutesModal(true)}
                  >
                    {selectedRoutes.length > 0 ? `${selectedRoutes.length} rota(s) selecionada(s)` : 'Todas as rotas'}
                  </IonButton>
                </IonItem>

                {/* Botão Gerar Dashboard */}
                <IonButton
                  expand="block"
                  onClick={handleGenerateDashboard}
                  disabled={isLoading}
                  style={{ marginTop: '20px' }}
                >
                  {isLoading ? <IonSpinner name="dots" /> : 'Gerar Dashboard'}
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Modal Data Inicial */}
          <IonModal isOpen={showDateFromModal} onDidDismiss={() => setShowDateFromModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Selecionar Data Inicial</IonTitle>
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
                  Confirmar
                </IonButton>
              </div>
            </IonContent>
          </IonModal>

          {/* Modal Data Final */}
          <IonModal isOpen={showDateToModal} onDidDismiss={() => setShowDateToModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Selecionar Data Final</IonTitle>
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
                  Confirmar
                </IonButton>
              </div>
            </IonContent>
          </IonModal>

          {/* Modal Seleção de Rotas */}
          <IonModal isOpen={showRoutesModal} onDidDismiss={() => setShowRoutesModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Selecionar Rotas</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowRoutesModal(false)}>
                    <IonIcon icon={close} />
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <div style={{ padding: '16px' }}>
                <IonItem>
                  <IonLabel>
                    <h3>Rotas Disponíveis</h3>
                    <p>Selecione as rotas para filtrar o dashboard, se não filtrar nenhuma, todas as rotas serão consideradas</p>
                  </IonLabel>
                </IonItem>
                
                {isLoadingRoutes ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <IonSpinner name="dots" />
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>Carregando rotas...</p>
                  </div>
                ) : routes.length > 0 ? (
                  <IonList>
                    {routes.map(route => (
                      <IonItem key={route.id}>
                        <IonLabel>{route.name}</IonLabel>
                        <IonCheckbox
                          slot="end"
                          checked={selectedRoutes.includes(route.id)}
                          onIonChange={() => handleRouteToggle(route.id)}
                        />
                      </IonItem>
                    ))}
                  </IonList>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ color: '#999' }}>Nenhuma rota encontrada</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() => setShowRoutesModal(false)}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </IonButton>
                  <IonButton
                    expand="block"
                    onClick={() => setShowRoutesModal(false)}
                    style={{ flex: 1 }}
                  >
                    Aplicar ({selectedRoutes.length})
                  </IonButton>
                </div>
              </div>
            </IonContent>
          </IonModal>

          {/* Modal Relatório */}
          <IonModal isOpen={showReportModal} onDidDismiss={() => setShowReportModal(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Dashboard Gerado</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowReportModal(false)}>
                    <IonIcon icon={close} />
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              {dashboardData && (
                <div style={{ padding: '16px' }}>
                  <IonCard style={{ borderRadius: '12px', marginBottom: '16px' }}>
                    <IonCardHeader>
                      <IonCardTitle>Resumo Geral</IonCardTitle>
                      <p style={{ color: '#666', fontSize: '12px', margin: '8px 0 0 0' }}>
                        Gerado em: {new Date(dashboardData.generatedAt).toLocaleString('pt-BR')}
                      </p>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonGrid>
                        <IonRow>
                          <IonCol size="6">
                            <p><strong>Total Arrecadado:</strong></p>
                            <p style={{ fontSize: '20px', color: '#28a745', fontWeight: 'bold' }}>
                              {formatCurrency(dashboardData.totalCollected || 0)}
                            </p>
                          </IonCol>
                          <IonCol size="6">
                            <p><strong>Total Gastos:</strong></p>
                            <p style={{ fontSize: '20px', color: '#dc3545', fontWeight: 'bold' }}>
                              {formatCurrency(dashboardData.totalExpenses || 0)}
                            </p>
                          </IonCol>
                        </IonRow>
                        <IonRow>
                          <IonCol size="6">
                            <p><strong>Saldo Líquido:</strong></p>
                            <p style={{ fontSize: '20px', color: '#007bff', fontWeight: 'bold' }}>
                              {formatCurrency(dashboardData.totalBalance || 0)}
                            </p>
                          </IonCol>
                          <IonCol size="6">
                            <p><strong>Efficiência:</strong></p>
                            <p style={{ fontSize: '20px', color: '#6f42c1', fontWeight: 'bold' }}>
                              {formatPercentage(dashboardData.totalEfficiency || 0)}
                            </p>
                          </IonCol>
                        </IonRow>
                        <IonRow>
                          <IonCol size="6">
                            <p><strong>Total Clientes:</strong></p>
                            <p style={{ fontSize: '18px' }}>
                              {dashboardData.totalClients || 0}
                            </p>
                          </IonCol>
                          <IonCol size="6">
                            <p><strong>Devedores:</strong></p>
                            <p style={{ fontSize: '18px', color: '#dc3545' }}>
                              {dashboardData.totalDebtors || 0} ({formatCurrency(dashboardData.totalDebtAmount || 0)})
                            </p>
                          </IonCol>
                        </IonRow>
                        <IonRow>
                          <IonCol size="6">
                            <p><strong>Dias Ativos:</strong></p>
                            <p style={{ fontSize: '16px' }}>
                              {dashboardData.activeDays || 0}
                            </p>
                          </IonCol>
                          <IonCol size="6">
                            <p><strong>Dias sem Coleta:</strong></p>
                            <p style={{ fontSize: '16px', color: '#dc3545' }}>
                              {dashboardData.daysWithoutCollection || 0}
                            </p>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </IonCardContent>
                  </IonCard>

                  {/* Dados Adicionais */}
                  <IonCard style={{ borderRadius: '12px', marginBottom: '16px' }}>
                    <IonCardHeader>
                      <IonCardTitle>Métricas Adicionais</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonGrid>
                        <IonRow>
                          <IonCol size="6">
                            <p><strong>Coleta Esperada:</strong></p>
                            <p>{formatCurrency(dashboardData.expectedCollection || 0)}</p>
                          </IonCol>
                          <IonCol size="6">
                            <p><strong>Média Diária:</strong></p>
                            <p>{formatCurrency(dashboardData.averageDailyCollection || 0)}</p>
                          </IonCol>
                        </IonRow>
                        <IonRow>
                          <IonCol size="6">
                            <p><strong>Razão de Coleta:</strong></p>
                            <p>{formatPercentage(dashboardData.collectionRatio || 0)}</p>
                          </IonCol>
                          <IonCol size="6">
                            <p><strong>Razão de Gastos:</strong></p>
                            <p>{formatPercentage(dashboardData.expenseRatio || 0)}</p>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </IonCardContent>
                  </IonCard>

                  {/* Dados por Rota */}
                  {dashboardData.routesData && Array.isArray(dashboardData.routesData) && dashboardData.routesData.length > 0 && (
                    <IonCard style={{ borderRadius: '12px' }}>
                      <IonCardHeader>
                        <IonCardTitle>Dados por Rota</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        {dashboardData.routesData.map((route: any, index: number) => (
                          <div key={index} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                            <h4>{route.routeName || `Rota ${index + 1}`}</h4>
                            <IonGrid>
                              <IonRow>
                                <IonCol size="6">
                                  <p><strong>Arrecadado:</strong> {formatCurrency(route.totalCollected || 0)}</p>
                                  <p><strong>Gastos:</strong> {formatCurrency(route.totalExpenses || 0)}</p>
                                </IonCol>
                                <IonCol size="6">
                                  <p><strong>Saldo:</strong> {formatCurrency(route.totalBalance || 0)}</p>
                                  <p><strong>Efficiência:</strong> {formatPercentage(route.efficiency || 0)}</p>
                                </IonCol>
                              </IonRow>
                            </IonGrid>
                          </div>
                        ))}
                      </IonCardContent>
                    </IonCard>
                  )}

                  {/* Mensagem se não houver dados */}
                  {(!dashboardData.routesData || !Array.isArray(dashboardData.routesData) || dashboardData.routesData.length === 0) && (
                    <IonCard style={{ borderRadius: '12px' }}>
                      <IonCardContent>
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <p style={{ color: '#666' }}>
                            <strong>Nenhum dado detalhado encontrado para o período selecionado.</strong>
                          </p>
                          <p style={{ color: '#999', fontSize: '14px' }}>
                            Tente selecionar um período diferente ou verificar se há registros nas rotas selecionadas.
                          </p>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  )}
                </div>
              )}
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

  export default Dashboard;
