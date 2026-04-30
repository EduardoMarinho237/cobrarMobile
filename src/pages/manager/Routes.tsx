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
  IonModal,
  IonButtons,
  IonIcon,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/react';
import { add, eye, eyeOff, trash, key, create, refresh, lockClosed, lockOpen } from 'ionicons/icons';
import { getRoutes, createRoute, updateRoute, deleteRoute } from '../../services/routeApi';
import { toggleRouteAudit, changeManagerPassword } from '../../services/api';
import { fecharDiaRoute, abrirDiaRoute } from '../../services/fechamentoApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import { translateRole } from '../../utils/roleTranslation';

interface Route {
  id: number;
  name: string;
  login: string;
  role: string;
  lastAccess: string | null;
  appearOnAudit?: boolean;
  restricted?: boolean;
  dayClosed?: boolean;
  tax?: number;
}

const Routes: React.FC = () => {
  const { t } = useTranslation();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRestrictAlert, setShowRestrictAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDayCloseAlert, setShowDayCloseAlert] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  
  // Form states
  const [newRoute, setNewRoute] = useState({ name: '', login: '', password: '', confirmPassword: '', tax: '' });
  const [editRoute, setEditRoute] = useState({ name: '', login: '', tax: '' });
  const [newPassword, setNewPassword] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setIsLoading(true);
    try {
      const response = await getRoutes();
      console.log('Resposta da API getRoutes:', response);
      
      // Se a resposta tiver a estrutura { success, data }, extrai os dados
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = response.data;
      }
      
      // Filtra apenas routes (role = 'ROUTE')
      const routesData = Array.isArray(data) ? data.filter((route: any) => route.role === 'ROUTE') : [];
      
      setRoutes(routesData.map((route: any) => ({ 
        ...route, 
        restricted: !route.appearOnAudit // Se appearOnAudit for false, restricted é true
      })));
      console.log('Routes carregados e filtrados:', routesData);
    } catch (error) {
      console.error('Erro ao carregar routes:', error);
      showToast(t('pages.routes.errorLoadingRoutes'), 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
    
    // Configurar o refresher
    const setupRefresher = () => {
      const refresher = document.getElementById('routes-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          await loadRoutes();
          refresher.complete();
        });
      }
    };

    // Usar setTimeout para garantir que o DOM esteja pronto
    setTimeout(setupRefresher, 100);
  }, []);

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const validateFields = (name: string, login: string, password?: string, confirmPassword?: string, tax?: string) => {
    if (!name.trim()) {
      showToast(t('pages.routes.nameRequired'), 'danger');
      return false;
    }
    
    if (!login.trim()) {
      showToast(t('pages.routes.loginRequired'), 'danger');
      return false;
    }
    
    if (login.includes(' ')) {
      showToast(t('pages.routes.loginNoSpaces'), 'danger');
      return false;
    }
    
    if (tax !== undefined) {
      if (!tax.trim()) {
        showToast(t('pages.routes.taxRequired'), 'danger');
        return false;
      }
      
      const taxValue = parseInt(tax);
      if (isNaN(taxValue) || taxValue < 0) {
        showToast(t('pages.routes.taxInvalid'), 'danger');
        return false;
      }
    }
    
    if (password !== undefined && confirmPassword !== undefined) {
      if (!password.trim()) {
        showToast(t('pages.routes.passwordRequired'), 'danger');
        return false;
      }
      
      if (password !== confirmPassword) {
        showToast(t('pages.routes.passwordMismatch'), 'danger');
        return false;
      }
    }
    
    return true;
  };

  const handleCreateRoute = async () => {
    if (!validateFields(newRoute.name, newRoute.login, newRoute.password, newRoute.confirmPassword, newRoute.tax)) {
      return;
    }

    try {
      const response = await createRoute(newRoute.name, newRoute.login, newRoute.password, parseInt(newRoute.tax));
      
      // Usa a mensagem da API
      showToast(response.message || t('pages.routes.routeCreatedSuccess'), response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowCreateModal(false);
        setNewRoute({ name: '', login: '', password: '', confirmPassword: '', tax: '' });
        loadRoutes();
      }
    } catch (error) {
      console.error('Erro ao criar route:', error);
      showToast(t('pages.routes.connectionError'), 'danger');
    }
  };

  const handleEditRoute = () => {
    if (!validateFields(editRoute.name, editRoute.login, undefined, undefined, editRoute.tax)) {
      return;
    }

    if (!selectedRoute) return;

    console.log('Atualizando route:', { 
      id: selectedRoute.id, 
      name: editRoute.name, 
      login: editRoute.login,
      tax: parseInt(editRoute.tax)
    });

    updateRoute(selectedRoute.id, editRoute.name, editRoute.login, parseInt(editRoute.tax))
      .then(response => {
        console.log('Resposta da API:', response);
        
        // Usa a mensagem da API
        showToast(response.message || t('pages.routes.routeUpdatedSuccess'), response.success ? 'success' : 'danger');
        
        // Sempre volta para a listagem, mesmo com erro
        setShowEditModal(false);
        setEditRoute({ name: '', login: '', tax: '' });
        setSelectedRoute(null);
        loadRoutes();
      })
      .catch((error) => {
        console.error('Erro ao atualizar route:', error);
        showToast(t('pages.routes.connectionError'), 'danger');
        
        // Mesmo com erro, volta para a listagem
        setShowEditModal(false);
        setEditRoute({ name: '', login: '', tax: '' });
        setSelectedRoute(null);
        loadRoutes();
      });
  };

  const handleDeleteRoute = () => {
    if (!selectedRoute) return;

    deleteRoute(selectedRoute.id)
      .then(response => {
        // Usa a mensagem da API
        showToast(response.message || t('pages.routes.routeDeletedSuccess'), response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedRoute(null);
          loadRoutes();
        }
      })
      .catch((error) => {
        console.error('Erro ao excluir route:', error);
        showToast(t('pages.routes.connectionError'), 'danger');
      });
  };

  const openEditModal = (route: Route) => {
    setSelectedRoute(route);
    setEditRoute({ name: route.name, login: route.login, tax: route.tax?.toString() || '' });
    setShowEditModal(true);
  };

  const handleRestrictAccess = async () => {
    if (!selectedRoute) return;

    console.log('Alterando acesso da route:', { 
      id: selectedRoute.id, 
      name: selectedRoute.name,
      currentRestricted: selectedRoute.restricted 
    });

    try {
      const newAppearOnAudit = selectedRoute.restricted ? true : false; // Se está restrito, volta para true (acesso restaurado)
      const response = await toggleRouteAudit(selectedRoute.id, newAppearOnAudit);
      
      console.log('Resposta da API:', response);
      
      // Atualiza o estado local independentemente da resposta
      setRoutes(routes.map(r => 
        r.id === selectedRoute.id ? { 
          ...r, 
          restricted: !newAppearOnAudit // Se appearOnAudit for true, restricted é false
        } : r
      ));
      
      // Usa a mensagem da API
      showToast(response.message || (newAppearOnAudit ? t('pages.routes.accessRestored') : t('pages.routes.accessRestricted')), 
                response.success ? 'success' : 'danger');
      
    } catch (error) {
      console.error('Erro ao alterar acesso:', error);
      showToast(t('pages.routes.connectionError'), 'danger');
      
      // Mesmo com erro, tenta atualizar o estado local
      setRoutes(routes.map(r => 
        r.id === selectedRoute.id ? { 
          ...r, 
          restricted: !r.restricted 
        } : r
      ));
    }
    
    setShowRestrictAlert(false);
    setSelectedRoute(null);
  };

  const handleChangePassword = async () => {
    if (!selectedRoute) return;
    
    if (!newPassword.password.trim()) {
      showToast(t('pages.routes.passwordRequired'), 'danger');
      return;
    }
    
    if (newPassword.password !== newPassword.confirmPassword) {
      showToast(t('pages.routes.passwordMismatch'), 'danger');
      return;
    }
    
    try {
      const response = await changeManagerPassword(selectedRoute.id, newPassword.password);
      
      // SEMPRE usa a mensagem da API, se não tiver mensagem, mostra erro de conexão
      const message = response?.message || t('pages.routes.connectionErrorSimple');
      const color = response?.success === true ? 'success' : 'danger';
      
      showToast(message, color);
      
      if (response?.success === true) {
        setShowPasswordModal(false);
        setNewPassword({ password: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      showToast(t('pages.routes.connectionErrorSimple'), 'danger');
    }
  };

  const handleToggleDayClose = async () => {
    if (!selectedRoute) return;

    console.log('=== INÍCIO handleToggleDayClose ===');
    console.log('selectedRoute:', selectedRoute);
    console.log('dayClosed:', selectedRoute.dayClosed);

    try {
      const isCurrentlyClosed = selectedRoute.dayClosed;
      
      let response;
      if (isCurrentlyClosed) {
        // Abrir dia fechado
        response = await abrirDiaRoute(selectedRoute.id);
      } else {
        // Fechar dia aberto
        response = await fecharDiaRoute(selectedRoute.id);
      }
      
      console.log('Resposta da API:', response);
      
      // Usa a mensagem da API
      showToast(response.message || (isCurrentlyClosed ? t('pages.routes.dayOpened') : t('pages.routes.dayClosed')), 
                response.success ? 'success' : 'danger');
      
      if (response.success) {
        // Atualiza o estado local
        setRoutes(routes.map(r => 
          r.id === selectedRoute.id ? { 
            ...r, 
            dayClosed: !isCurrentlyClosed // Inverte o estado
          } : r
        ));
        setShowDayCloseAlert(false);
        setSelectedRoute(null);
        console.log('=== FIM handleToggleDayClose (SUCESSO) ===');
      } else {
        console.log('=== FIM handleToggleDayClose (ERRO API) ===');
      }
    } catch (error) {
      console.error('Erro ao alterar status do dia:', error);
      console.log('=== FIM handleToggleDayClose (ERRO CATCH) ===');
      showToast(t('pages.routes.connectionError'), 'danger');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('pages.routes.never');
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.routes.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="routes-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px' }}>
          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: '200px',
              gap: '16px'
            }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', fontSize: '14px' }}>{t('pages.routes.loadingRoutes')}</p>
            </div>
          ) : (
            <>
              <IonButton 
                expand="block" 
                shape="round" 
                onClick={() => setShowCreateModal(true)}
                style={{ marginBottom: '16px' }}
              >
                <IonIcon slot="start" icon={add} />
                {t('pages.routes.addRoute')}
              </IonButton>

              {routes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>{t('pages.routes.noRouteCreated')}</p>
                </div>
              ) : (
                routes.map((route) => (
                  <IonCard 
                    key={route.id} 
                    style={{ 
                      opacity: route.restricted ? 0.6 : 1,
                      marginBottom: '16px',
                      borderRadius: '12px'
                    }}
                  >
                    <IonCardHeader>
                      <IonCardTitle>{route.name}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <IonGrid>
                        <IonRow>
                          <IonCol size="12">
                            <IonItem>
                              <IonLabel>
                                <h3>{t('pages.routes.login')}: {route.login}</h3>
                              </IonLabel>
                            </IonItem>
                          </IonCol>
                          <IonCol size="12">
                            <IonItem>
                              <IonLabel>
                                <h3>{t('pages.routes.role')}: {translateRole(route.role, t)}</h3>
                              </IonLabel>
                            </IonItem>
                          </IonCol>
                          <IonCol size="12">
                            <IonItem>
                              <IonLabel>
                                <h3>{t('pages.routes.lastAccess')}: {formatDate(route.lastAccess)}</h3>
                              </IonLabel>
                            </IonItem>
                          </IonCol>
                          <IonCol size="12">
                            <IonItem>
                              <IonLabel>
                                <h3>{t('pages.routes.clients')}: 0</h3>
                              </IonLabel>
                            </IonItem>
                          </IonCol>
                          <IonCol size="12">
                            <IonItem>
                              <IonLabel>
                                <h3>{t('pages.routes.cashBalance')}: $ 0,00</h3>
                              </IonLabel>
                            </IonItem>
                          </IonCol>
                          <IonCol size="12">
                            <IonItem>
                              <IonLabel>
                                <h3>{t('pages.routes.dayStatus')}: {route.dayClosed ? t('pages.routes.closed') : t('pages.routes.open')}</h3>
                              </IonLabel>
                            </IonItem>
                          </IonCol>
                          <IonCol size="12">
                            <IonItem>
                              <IonLabel>
                                <h3>{t('pages.routes.tax')}: {route.tax || 0}%</h3>
                              </IonLabel>
                            </IonItem>
                          </IonCol>
                        </IonRow>
                        <IonRow>
                          <IonCol size="2.4">
                            <IonButton
                              fill="clear"
                              onClick={() => openEditModal(route)}
                            >
                              <IonIcon icon={create} />
                            </IonButton>
                          </IonCol>
                          <IonCol size="2.4">
                            <IonButton
                              fill="clear"
                              onClick={() => {
                                setSelectedRoute(route);
                                setShowRestrictAlert(true);
                              }}
                            >
                              <IonIcon icon={route.restricted ? eyeOff : eye} />
                            </IonButton>
                          </IonCol>
                          <IonCol size="2.4">
                            <IonButton
                              fill="clear"
                              onClick={() => {
                                setSelectedRoute(route);
                                setShowPasswordModal(true);
                              }}
                            >
                              <IonIcon icon={key} />
                            </IonButton>
                          </IonCol>
                          <IonCol size="2.4">
                            <IonButton
                              fill="clear"
                              color={route.dayClosed ? 'success' : 'warning'}
                              onClick={() => {
                                setSelectedRoute(route);
                                setShowDayCloseAlert(true);
                              }}
                            >
                              <IonIcon icon={route.dayClosed ? lockOpen : lockClosed} />
                            </IonButton>
                          </IonCol>
                          <IonCol size="2.4">
                            <IonButton
                              fill="clear"
                              color="danger"
                              onClick={() => {
                                setSelectedRoute(route);
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
                )))}
              </>
          )}
        </div>

        {/* Modal Criar Route */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.routes.addRoute')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonInput
                  label={t('pages.routes.name')}
                  labelPlacement="floating"
                  placeholder={t('pages.routes.namePlaceholder')}
                  value={newRoute.name}
                  onIonInput={(e: any) => setNewRoute({ ...newRoute, name: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.routes.login')}
                  labelPlacement="floating"
                  placeholder={t('pages.routes.loginPlaceholder')}
                  value={newRoute.login}
                  onIonInput={(e: any) => setNewRoute({ ...newRoute, login: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.routes.password')}
                  labelPlacement="floating"
                  placeholder={t('pages.routes.passwordPlaceholder')}
                  type="password"
                  value={newRoute.password}
                  onIonInput={(e: any) => setNewRoute({ ...newRoute, password: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.routes.confirmPassword')}
                  labelPlacement="floating"
                  placeholder={t('pages.routes.confirmPasswordPlaceholder')}
                  type="password"
                  value={newRoute.confirmPassword}
                  onIonInput={(e: any) => setNewRoute({ ...newRoute, confirmPassword: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.routes.tax')}
                  labelPlacement="floating"
                  placeholder={t('pages.routes.taxPlaceholder')}
                  type="number"
                  value={newRoute.tax}
                  onIonInput={(e: any) => setNewRoute({ ...newRoute, tax: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleCreateRoute}
                style={{ marginTop: '16px' }}
              >
                {t('pages.routes.create')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Route */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.routes.editRoute')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonInput
                  label={t('pages.routes.name')}
                  labelPlacement="floating"
                  placeholder={t('pages.routes.namePlaceholder')}
                  value={editRoute.name}
                  onIonInput={(e: any) => setEditRoute({ ...editRoute, name: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.routes.login')}
                  labelPlacement="floating"
                  placeholder={t('pages.routes.loginPlaceholder')}
                  value={editRoute.login}
                  onIonInput={(e: any) => setEditRoute({ ...editRoute, login: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.routes.tax')}
                  labelPlacement="floating"
                  placeholder={t('pages.routes.taxPlaceholder')}
                  type="number"
                  value={editRoute.tax}
                  onIonInput={(e: any) => setEditRoute({ ...editRoute, tax: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleEditRoute}
                style={{ marginTop: '16px' }}
              >
                {t('pages.routes.update')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Trocar Senha */}
        <IonModal isOpen={showPasswordModal} onDidDismiss={() => setShowPasswordModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.routes.changePassword')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPasswordModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonInput
                  label={t('pages.routes.password')}
                  labelPlacement="floating"
                  placeholder={t('pages.routes.passwordPlaceholder')}
                  type="password"
                  value={newPassword.password}
                  onIonInput={(e: any) => setNewPassword({ ...newPassword, password: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.routes.confirmPassword')}
                  labelPlacement="floating"
                  placeholder={t('pages.routes.confirmPasswordPlaceholder')}
                  type="password"
                  value={newPassword.confirmPassword}
                  onIonInput={(e: any) => setNewPassword({ ...newPassword, confirmPassword: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleChangePassword}
                style={{ marginTop: '16px' }}
              >
                {t('pages.routes.changePassword')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Restringir Acesso */}
        <IonAlert
          isOpen={showRestrictAlert}
          onDidDismiss={() => setShowRestrictAlert(false)}
          header={t('common.confirm')}
          message={selectedRoute?.restricted ? t('pages.routes.restoreAccess') + "?" : t('pages.routes.restrictAccess') + "?"}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('common.confirm'),
              handler: handleRestrictAccess
            }
          ]}
        />

        {/* Alert Fechar/Abrir Dia */}
        <IonAlert
          isOpen={showDayCloseAlert}
          onDidDismiss={() => setShowDayCloseAlert(false)}
          header={t('common.confirm')}
          message={selectedRoute?.dayClosed ? 
            t('pages.routes.confirmOpenDay', { routeName: selectedRoute?.name }) : 
            t('pages.routes.confirmCloseDay', { routeName: selectedRoute?.name })}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('common.confirm'),
              handler: handleToggleDayClose
            }
          ]}
        />

        {/* Alert Excluir Route */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={t('pages.routes.confirmDelete')}
          message={t('pages.routes.confirmDeleteMessage').replace('{routeName}', selectedRoute?.name || '')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('common.delete'),
              role: 'destructive',
              handler: handleDeleteRoute
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

export default Routes;
