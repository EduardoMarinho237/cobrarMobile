import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonModal,
  IonButtons,
  IonButton,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/react';
import { addCircle, eye, eyeOff, key, create, trash, lockClosed, lockOpen, arrowUpCircle, arrowDownCircle } from 'ionicons/icons';
import { getRoutes, createRoute, updateRoute, deleteRoute } from '../../services/routeApi';
import { toggleRouteAudit, changeManagerPassword } from '../../services/api';
import { fecharDiaRoute, abrirDiaRoute } from '../../services/fechamentoApi';
import { deposit, withdrawal } from '../../services/cashBoxApi';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import { translateRole } from '../../utils/roleTranslation';
import GreenHeader from '../../components/ui/GreenHeader';
import PrimaryButton from '../../components/ui/PrimaryButton';
import StyledInput from '../../components/ui/StyledInput';
import InfoRow from '../../components/ui/InfoRow';
import ActionButton from '../../components/ui/ActionButton';

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
  cashBalance?: number;
}

const Routes: React.FC = () => {
  const { t } = useTranslation();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showRestrictAlert, setShowRestrictAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDayCloseAlert, setShowDayCloseAlert] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  // Form states
  const [newRoute, setNewRoute] = useState({ name: '', login: '', password: '', confirmPassword: '', tax: '', initialDeposit: '' });
  const [editRoute, setEditRoute] = useState({ name: '', login: '', tax: '' });
  const [newPassword, setNewPassword] = useState({ password: '', confirmPassword: '' });
  const [cashAmount, setCashAmount] = useState({ amount: '', description: '' });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setIsLoading(true);
    try {
      const response = await getRoutes();
      console.log('Resposta da API getRoutes:', response);
      
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = response.data;
      }
      
      const routesData = Array.isArray(data) ? data.filter((route: any) => route.role === 'ROUTE') : [];
      
      setRoutes(routesData.map((route: any) => ({ 
        ...route, 
        restricted: !route.appearOnAudit
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
    
    const setupRefresher = () => {
      const refresher = document.getElementById('routes-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          await loadRoutes();
          refresher.complete();
        });
      }
    };

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
      const initialDeposit = newRoute.initialDeposit ? parseInt(newRoute.initialDeposit) : undefined;
      const response = await createRoute(newRoute.name, newRoute.login, newRoute.password, parseInt(newRoute.tax), initialDeposit);
      
      showToast(response.message || t('pages.routes.routeCreatedSuccess'), response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowCreateModal(false);
        setNewRoute({ name: '', login: '', password: '', confirmPassword: '', tax: '', initialDeposit: '' });
        loadRoutes();
      }
    } catch (error) {
      console.error('Erro ao criar route:', error);
      showToast(t('pages.routes.connectionError'), 'danger');
    }
  };

  const handleDeposit = async () => {
    if (!selectedRoute) return;
    const amount = parseInt(cashAmount.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast(t('pages.routes.invalidValue'), 'danger');
      return;
    }
    try {
      const response = await deposit({ routeId: selectedRoute.id, amount, description: cashAmount.description });
      showToast(response.message || t('pages.routes.depositSuccess'), response.success ? 'success' : 'danger');
      if (response.success) {
        setShowDepositModal(false);
        setCashAmount({ amount: '', description: '' });
        loadRoutes();
      }
    } catch (error) {
      showToast(t('pages.routes.depositError'), 'danger');
    }
  };

  const handleWithdrawal = async () => {
    if (!selectedRoute) return;
    const amount = parseInt(cashAmount.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast(t('pages.routes.invalidValue'), 'danger');
      return;
    }
    try {
      const response = await withdrawal({ routeId: selectedRoute.id, amount, description: cashAmount.description });
      showToast(response.message || t('pages.routes.withdrawalSuccess'), response.success ? 'success' : 'danger');
      if (response.success) {
        setShowWithdrawalModal(false);
        setCashAmount({ amount: '', description: '' });
        loadRoutes();
      }
    } catch (error) {
      showToast(t('pages.routes.withdrawalError'), 'danger');
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
        
        showToast(response.message || t('pages.routes.routeUpdatedSuccess'), response.success ? 'success' : 'danger');
        
        setShowEditModal(false);
        setEditRoute({ name: '', login: '', tax: '' });
        setSelectedRoute(null);
        loadRoutes();
      })
      .catch((error) => {
        console.error('Erro ao atualizar route:', error);
        showToast(t('pages.routes.connectionError'), 'danger');
        
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
      const newAppearOnAudit = selectedRoute.restricted ? true : false;
      const response = await toggleRouteAudit(selectedRoute.id, newAppearOnAudit);
      
      console.log('Resposta da API:', response);
      
      setRoutes(routes.map(r => 
        r.id === selectedRoute.id ? { 
          ...r, 
          restricted: !newAppearOnAudit
        } : r
      ));
      
      showToast(response.message || (newAppearOnAudit ? t('pages.routes.accessRestored') : t('pages.routes.accessRestricted')), 
                response.success ? 'success' : 'danger');
      
    } catch (error) {
      console.error('Erro ao alterar acesso:', error);
      showToast(t('pages.routes.connectionError'), 'danger');
      
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
        response = await abrirDiaRoute(selectedRoute.id);
      } else {
        response = await fecharDiaRoute(selectedRoute.id);
      }
      
      console.log('Resposta da API:', response);
      
      showToast(response.message || (isCurrentlyClosed ? t('pages.routes.dayOpened') : t('pages.routes.dayClosed')), 
                response.success ? 'success' : 'danger');
      
      if (response.success) {
        setRoutes(routes.map(r => 
          r.id === selectedRoute.id ? { 
            ...r, 
            dayClosed: !isCurrentlyClosed
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
        <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
          <IonTitle>{t('pages.routes.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="routes-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
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
              <PrimaryButton
                onClick={() => setShowCreateModal(true)}
                label={t('pages.routes.addRoute')}
                icon={addCircle}
              />

              {routes.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px',
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  marginTop: '8px'
                }}>
                  <p style={{ color: '#999', margin: 0, fontSize: '15px' }}>{t('pages.routes.noRouteCreated')}</p>
                </div>
              ) : (
                routes.map((route) => (
                  <div 
                    key={route.id}
                    style={{ 
                      opacity: route.restricted ? 0.55 : 1,
                      marginBottom: '16px',
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      backgroundColor: route.restricted ? '#ccc' : '#0c0989',
                      borderRadius: '16px 0 0 16px'
                    }} />
                    
                    <div style={{ paddingLeft: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#262626' }}>
                          {route.name}
                        </h2>
                        {route.restricted && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#999',
                            backgroundColor: '#f0f0f0',
                            padding: '4px 10px',
                            borderRadius: '20px'
                          }}>
                            {t('pages.routes.restricted')}
                          </span>
                        )}
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <InfoRow label={t('pages.routes.login')} value={route.login} />
                        <InfoRow label={t('pages.routes.role')} value={translateRole(route.role, t)} valueColor="#0c0989" />
                        <InfoRow label={t('pages.routes.lastAccess')} value={formatDate(route.lastAccess)} />
                        <InfoRow label={t('pages.routes.cashBalance')} value={formatCurrencyWithSymbol(route.cashBalance || 0)} valueColor={(route.cashBalance || 0) >= 0 ? '#0c0989' : '#dc3545'} />
                        <InfoRow label={t('pages.routes.dayStatus')} value={route.dayClosed ? t('pages.routes.closed') : t('pages.routes.open')} valueColor={route.dayClosed ? '#dc3545' : '#0c0989'} />
                        <InfoRow label={t('pages.routes.tax')} value={`${route.tax || 0}%`} showBorder={false} />
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                          <ActionButton
                            icon={arrowUpCircle}
                            label={t('pages.routes.depositButton')}
                            onClick={() => { setSelectedRoute(route); setShowDepositModal(true); }}
                            backgroundColor="#e8f5e9"
                            color="#2e7d32"
                          />
                        </div>
                        <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                          <ActionButton
                            icon={arrowDownCircle}
                            label={t('pages.routes.withdrawalButton')}
                            onClick={() => { setSelectedRoute(route); setShowWithdrawalModal(true); }}
                            backgroundColor="#fff3e0"
                            color="#e65100"
                          />
                        </div>
                        <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                          <ActionButton
                            icon={create}
                            label={t('pages.routes.editButton')}
                            onClick={() => openEditModal(route)}
                          />
                        </div>
                        <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                          <ActionButton
                            icon={route.restricted ? eye : eyeOff}
                            label={route.restricted ? t('pages.routes.restoreButton') : t('pages.routes.restrictButton')}
                            onClick={() => { setSelectedRoute(route); setShowRestrictAlert(true); }}
                            backgroundColor={route.restricted ? '#e8f5e9' : '#fff3e0'}
                            color={route.restricted ? '#2e7d32' : '#e65100'}
                          />
                        </div>
                        <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                          <ActionButton
                            icon={key}
                            label={t('pages.routes.passwordButton')}
                            onClick={() => { setSelectedRoute(route); setShowPasswordModal(true); }}
                          />
                        </div>
                        <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                          <ActionButton
                            icon={route.dayClosed ? lockOpen : lockClosed}
                            label={route.dayClosed ? t('pages.routes.openDayButton') : t('pages.routes.closeDayButton')}
                            onClick={() => { setSelectedRoute(route); setShowDayCloseAlert(true); }}
                            backgroundColor={route.dayClosed ? '#e8f5e9' : '#fff3e0'}
                            color={route.dayClosed ? '#2e7d32' : '#e65100'}
                          />
                        </div>
                        <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                          <ActionButton
                            icon={trash}
                            label={t('pages.routes.deleteButton')}
                            onClick={() => { setSelectedRoute(route); setShowDeleteAlert(true); }}
                            backgroundColor="#fff5f5"
                            color="#dc3545"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Modal Criar Route */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
              <IonTitle>{t('pages.routes.addRoute')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)} style={{ color: '#fff' }}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 20px))' }}>
              <StyledInput
                label={t('pages.routes.name')}
                placeholder={t('pages.routes.namePlaceholder')}
                value={newRoute.name}
                onIonInput={(e: any) => setNewRoute({ ...newRoute, name: e.detail.value! })}
              />
              <StyledInput
                label={t('pages.routes.login')}
                placeholder={t('pages.routes.loginPlaceholder')}
                value={newRoute.login}
                onIonInput={(e: any) => setNewRoute({ ...newRoute, login: e.detail.value! })}
              />
              <StyledInput
                label={t('pages.routes.password')}
                placeholder={t('pages.routes.passwordPlaceholder')}
                value={newRoute.password}
                onIonInput={(e: any) => setNewRoute({ ...newRoute, password: e.detail.value! })}
                type="password"
              />
              <StyledInput
                label={t('pages.routes.confirmPassword')}
                placeholder={t('pages.routes.confirmPasswordPlaceholder')}
                value={newRoute.confirmPassword}
                onIonInput={(e: any) => setNewRoute({ ...newRoute, confirmPassword: e.detail.value! })}
                type="password"
              />
              <StyledInput
                label={t('pages.routes.tax')}
                placeholder={t('pages.routes.taxPlaceholder')}
                value={newRoute.tax}
                onIonInput={(e: any) => setNewRoute({ ...newRoute, tax: e.detail.value! })}
                type="number"
              />
              <StyledInput
                label={t('pages.routes.initialDeposit')}
                placeholder="0"
                value={newRoute.initialDeposit}
                onIonInput={(e: any) => setNewRoute({ ...newRoute, initialDeposit: e.detail.value! })}
                type="number"
                marginBottom="24px"
              />
              <PrimaryButton onClick={handleCreateRoute} label={t('pages.routes.create')} />
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Depositar */}
        <IonModal isOpen={showDepositModal} onDidDismiss={() => setShowDepositModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
              <IonTitle>{t('pages.routes.depositTitle', { routeName: selectedRoute?.name })}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDepositModal(false)} style={{ color: '#fff' }}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 20px))' }}>
              <p style={{ marginBottom: '16px', color: '#666' }}>
                {t('pages.routes.currentBalance')} <strong style={{ color: '#0c0989' }}>{formatCurrencyWithSymbol(selectedRoute?.cashBalance || 0)}</strong>
              </p>
              <StyledInput
                label={t('pages.routes.value')}
                placeholder="0"
                value={cashAmount.amount}
                onIonInput={(e: any) => setCashAmount({ ...cashAmount, amount: e.detail.value! })}
                type="number"
              />
              <StyledInput
                label={t('pages.routes.description')}
                placeholder={t('pages.routes.depositReason')}
                value={cashAmount.description}
                onIonInput={(e: any) => setCashAmount({ ...cashAmount, description: e.detail.value! })}
                marginBottom="24px"
              />
              <PrimaryButton onClick={handleDeposit} label={t('pages.routes.depositButton')} />
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Retirar */}
        <IonModal isOpen={showWithdrawalModal} onDidDismiss={() => setShowWithdrawalModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
              <IonTitle>{t('pages.routes.withdrawalTitle', { routeName: selectedRoute?.name })}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowWithdrawalModal(false)} style={{ color: '#fff' }}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 20px))' }}>
              <p style={{ marginBottom: '16px', color: '#666' }}>
                {t('pages.routes.currentBalance')} <strong style={{ color: '#0c0989' }}>{formatCurrencyWithSymbol(selectedRoute?.cashBalance || 0)}</strong>
              </p>
              <StyledInput
                label={t('pages.routes.value')}
                placeholder="0"
                value={cashAmount.amount}
                onIonInput={(e: any) => setCashAmount({ ...cashAmount, amount: e.detail.value! })}
                type="number"
              />
              <StyledInput
                label={t('pages.routes.description')}
                placeholder={t('pages.routes.withdrawalReason')}
                value={cashAmount.description}
                onIonInput={(e: any) => setCashAmount({ ...cashAmount, description: e.detail.value! })}
                marginBottom="24px"
              />
              <PrimaryButton onClick={handleWithdrawal} label={t('pages.routes.withdrawalButton')} />
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Route */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
              <IonTitle>{t('pages.routes.editRoute')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)} style={{ color: '#fff' }}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 20px))' }}>
              <StyledInput
                label={t('pages.routes.name')}
                placeholder={t('pages.routes.namePlaceholder')}
                value={editRoute.name}
                onIonInput={(e: any) => setEditRoute({ ...editRoute, name: e.detail.value! })}
              />
              <StyledInput
                label={t('pages.routes.login')}
                placeholder={t('pages.routes.loginPlaceholder')}
                value={editRoute.login}
                onIonInput={(e: any) => setEditRoute({ ...editRoute, login: e.detail.value! })}
              />
              <StyledInput
                label={t('pages.routes.tax')}
                placeholder={t('pages.routes.taxPlaceholder')}
                value={editRoute.tax}
                onIonInput={(e: any) => setEditRoute({ ...editRoute, tax: e.detail.value! })}
                type="number"
                marginBottom="24px"
              />
              <PrimaryButton onClick={handleEditRoute} label={t('pages.routes.update')} />
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Trocar Senha */}
        <IonModal isOpen={showPasswordModal} onDidDismiss={() => setShowPasswordModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
              <IonTitle>{t('pages.routes.changePassword')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPasswordModal(false)} style={{ color: '#fff' }}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 20px))' }}>
              <StyledInput
                label={t('pages.routes.password')}
                placeholder={t('pages.routes.passwordPlaceholder')}
                value={newPassword.password}
                onIonInput={(e: any) => setNewPassword({ ...newPassword, password: e.detail.value! })}
                type="password"
              />
              <StyledInput
                label={t('pages.routes.confirmPassword')}
                placeholder={t('pages.routes.confirmPasswordPlaceholder')}
                value={newPassword.confirmPassword}
                onIonInput={(e: any) => setNewPassword({ ...newPassword, confirmPassword: e.detail.value! })}
                type="password"
                marginBottom="24px"
              />
              <PrimaryButton onClick={handleChangePassword} label={t('pages.routes.changePassword')} />
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
