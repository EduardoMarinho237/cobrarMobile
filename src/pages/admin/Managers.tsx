import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonItem,
  IonInput,
  IonModal,
  IonButtons,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { addCircle, eye, eyeOff, key, create } from 'ionicons/icons';
import { createManager, getManagers, updateManager, toggleManagerAudit, changeManagerPassword } from '../../services/api';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import { translateRole } from '../../utils/roleTranslation';
import StyledInput from '../../components/ui/StyledInput';
import InfoRow from '../../components/ui/InfoRow';
import ActionButton from '../../components/ui/ActionButton';
import PrimaryButton from '../../components/ui/PrimaryButton';

interface Manager {
  id: number;
  name: string;
  login: string;
  role: string;
  lastAccess: string | null;
  restricted?: boolean;
  routeCount?: number;
  cashBalance?: number;
  appearOnAudit?: boolean;
}

const Managers: React.FC = () => {
  const { t } = useTranslation();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRestrictAlert, setShowRestrictAlert] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  
  // Form states
  const [newManager, setNewManager] = useState({ name: '', login: '', password: '', confirmPassword: '' });
  const [editManager, setEditManager] = useState({ name: '', login: '' });
  const [newPassword, setNewPassword] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    try {
      const response = await getManagers();
      console.log('Resposta da API getManagers:', response);
      
      // Se a resposta tiver a estrutura { success, data }, extrai os dados
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = response.data;
      }
      
      // Filtra apenas managers (role = 'MANAGER')
      const managersData = Array.isArray(data) ? data.filter((manager: any) => manager.role === 'MANAGER') : [];
      
      setManagers(managersData.map((manager: any) => ({ 
        ...manager, 
        appearOnAudit: manager.appearOnAudit !== false, // Default true se não for false
        restricted: manager.appearOnAudit === false // true se appearOnAudit for false
      })));
      console.log('Managers carregados e filtrados:', managersData);
    } catch (error) {
      console.error('Erro ao carregar managers:', error);
      showToast(t('pages.managers.errorLoading'), 'danger');
    }
  };

  useEffect(() => {
    loadManagers();
    
    // Configurar o refresher
    const setupRefresher = () => {
      const refresher = document.getElementById('managers-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          await loadManagers();
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

  const validateFields = (name: string, login: string, password?: string, confirmPassword?: string) => {
    if (!name.trim()) {
      showToast(t('pages.managers.nameRequired'), 'danger');
      return false;
    }
    
    if (!login.trim()) {
      showToast(t('pages.managers.loginRequired'), 'danger');
      return false;
    }
    
    if (login.includes(' ')) {
      showToast(t('pages.managers.loginNoSpaces'), 'danger');
      return false;
    }
    
    if (password !== undefined && confirmPassword !== undefined) {
      if (!password.trim()) {
        showToast(t('pages.managers.passwordRequired'), 'danger');
        return false;
      }
      
      if (password !== confirmPassword) {
        showToast(t('pages.managers.passwordsDontMatch'), 'danger');
        return false;
      }
    }
    
    return true;
  };

  const handleCreateManager = async () => {
    if (!validateFields(newManager.name, newManager.login, newManager.password, newManager.confirmPassword)) {
      return;
    }

    try {
      const response = await createManager(newManager.name, newManager.login, newManager.password);
      
      // Usa a mensagem da API
      showToast(response.message || t('pages.managers.createdSuccess'), response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowCreateModal(false);
        setNewManager({ name: '', login: '', password: '', confirmPassword: '' });
        loadManagers();
      }
    } catch (error) {
      console.error('Erro ao criar manager:', error);
      showToast(t('common.connectionError'), 'danger');
    }
  };

  const handleEditManager = () => {
    if (!validateFields(editManager.name, editManager.login)) {
      return;
    }

    if (!selectedManager) return;

    updateManager(selectedManager.id, editManager.name, editManager.login)
      .then(response => {
        // Usa a mensagem da API
        showToast(response.message || t('pages.managers.updatedSuccess'), response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowEditModal(false);
          setEditManager({ name: '', login: '' });
          setSelectedManager(null);
          loadManagers();
        }
      })
      .catch((error) => {
        console.error('Erro ao atualizar manager:', error);
        showToast(t('common.connectionError'), 'danger');
      });
  };

  const openEditModal = (manager: Manager) => {
    setSelectedManager(manager);
    setEditManager({ name: manager.name, login: manager.login });
    setShowEditModal(true);
  };

  const handleRestrictAccess = async () => {
    if (!selectedManager) return;

    console.log('Alterando acesso do manager:', { 
      id: selectedManager.id, 
      name: selectedManager.name,
      currentAppearOnAudit: selectedManager.appearOnAudit 
    });

    try {
      const newAppearOnAudit = !selectedManager.appearOnAudit;
      const response = await toggleManagerAudit(selectedManager.id, newAppearOnAudit);
      
      console.log('Resposta da API:', response);
      
      // Atualiza o estado local independentemente da resposta
      setManagers(managers.map(m => 
        m.id === selectedManager.id ? { 
          ...m, 
          appearOnAudit: newAppearOnAudit, 
          restricted: !newAppearOnAudit 
        } : m
      ));
      
      // Usa a mensagem da API
      showToast(response.message || (newAppearOnAudit ? t('pages.managers.accessRestored') : t('pages.managers.accessRestricted')), 
                response.success ? 'success' : 'danger');
      
    } catch (error) {
      console.error('Erro ao alterar acesso:', error);
      showToast(t('common.connectionError'), 'danger');
      
      // Mesmo com erro, tenta atualizar o estado local
      const newAppearOnAudit = !selectedManager.appearOnAudit;
      setManagers(managers.map(m => 
        m.id === selectedManager.id ? { 
          ...m, 
          appearOnAudit: newAppearOnAudit, 
          restricted: !newAppearOnAudit 
        } : m
      ));
    }
    
    setShowRestrictAlert(false);
    setSelectedManager(null);
  };

  const handleChangePassword = async () => {
    if (!selectedManager) return;
    
    if (!newPassword.password.trim()) {
      showToast(t('pages.managers.passwordRequired'), 'danger');
      return;
    }
    
    if (newPassword.password.length < 6) {
      showToast(t('pages.managers.passwordMinLength'), 'danger');
      return;
    }
    
    if (newPassword.password !== newPassword.confirmPassword) {
      showToast(t('pages.managers.passwordsDontMatch'), 'danger');
      return;
    }
    
    try {
      const response = await changeManagerPassword(selectedManager.id, newPassword.password);
      
      // SEMPRE usa a mensagem da API, se não tiver mensagem, mostra erro de conexão
      const message = response?.message || t('common.connectionError');
      const color = response?.success === true ? 'success' : 'danger';
      
      showToast(message, color);
      
      if (response?.success === true) {
        setShowPasswordModal(false);
        setNewPassword({ password: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      showToast(t('common.connectionError'), 'danger');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('pages.managers.never');
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#098947', '--color': '#fff' }}>
          <IonTitle>{t('pages.managers.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="managers-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px' }}>
          <PrimaryButton
            onClick={() => setShowCreateModal(true)}
            label={t('pages.managers.addManager')}
            icon={addCircle}
          />

          {managers.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              backgroundColor: '#fff',
              borderRadius: '16px',
              marginTop: '8px'
            }}>
              <p style={{ color: '#999', margin: 0, fontSize: '15px' }}>{t('pages.managers.empty')}</p>
            </div>
          ) : (
            managers.map((manager) => (
            <div 
              key={manager.id}
              style={{ 
                opacity: manager.restricted ? 0.55 : 1,
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
                backgroundColor: manager.restricted ? '#ccc' : '#098947',
                borderRadius: '16px 0 0 16px'
              }} />
              
              <div style={{ paddingLeft: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#262626' }}>
                    {manager.name}
                  </h2>
                  {manager.restricted && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#999',
                      backgroundColor: '#f0f0f0',
                      padding: '4px 10px',
                      borderRadius: '20px'
                    }}>
                      {t('pages.managers.restricted')}
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <InfoRow label={t('pages.managers.login')} value={manager.login} />
                  <InfoRow label={t('pages.managers.role')} value={translateRole(manager.role, t)} valueColor="#098947" />
                  <InfoRow label={t('pages.managers.lastAccess')} value={formatDate(manager.lastAccess)} />
                  <InfoRow label={t('pages.managers.routesCount')} value={String(manager.routeCount || 0)} />
                  <InfoRow label={t('pages.managers.cashBalance')} value={`$${(manager.cashBalance || 0).toFixed(2)}`} valueColor="#098947" showBorder={false} />
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                    <ActionButton
                      icon={create}
                      label={t('pages.managers.editButton')}
                      onClick={() => openEditModal(manager)}
                    />
                  </div>
                  <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                    <ActionButton
                      icon={manager.restricted ? eye : eyeOff}
                      label={manager.restricted ? t('pages.managers.restoreButton') : t('pages.managers.restrictButton')}
                      onClick={() => { setSelectedManager(manager); setShowRestrictAlert(true); }}
                      backgroundColor={manager.restricted ? '#e8f5e9' : '#fff3e0'}
                      color={manager.restricted ? '#2e7d32' : '#e65100'}
                    />
                  </div>
                  <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                    <ActionButton
                      icon={key}
                      label={t('pages.managers.passwordButton')}
                      onClick={() => { setSelectedManager(manager); setShowPasswordModal(true); }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )))}
        </div>

        {/* Modal Criar Manager */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#098947', '--color': '#fff' }}>
              <IonTitle>{t('pages.managers.addManager')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)} style={{ color: '#fff' }}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px' }}>
              <StyledInput
                label={t('pages.managers.name')}
                placeholder={t('pages.managers.namePlaceholder')}
                value={newManager.name}
                onIonInput={(e: any) => setNewManager({ ...newManager, name: e.detail.value! })}
              />
              <StyledInput
                label={t('pages.managers.login')}
                placeholder={t('pages.managers.loginPlaceholder')}
                value={newManager.login}
                onIonInput={(e: any) => setNewManager({ ...newManager, login: e.detail.value! })}
              />
              <StyledInput
                label={t('pages.managers.password')}
                placeholder={t('pages.managers.passwordPlaceholder')}
                value={newManager.password}
                onIonInput={(e: any) => setNewManager({ ...newManager, password: e.detail.value! })}
                type="password"
              />
              <StyledInput
                label={t('pages.managers.confirmPassword')}
                placeholder={t('pages.managers.confirmPasswordPlaceholder')}
                value={newManager.confirmPassword}
                onIonInput={(e: any) => setNewManager({ ...newManager, confirmPassword: e.detail.value! })}
                type="password"
                marginBottom="24px"
              />
              <PrimaryButton onClick={handleCreateManager} label={t('pages.managers.create')} />
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Manager */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#098947', '--color': '#fff' }}>
              <IonTitle>{t('pages.managers.editManager')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)} style={{ color: '#fff' }}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px' }}>
              <StyledInput
                label={t('pages.managers.name')}
                placeholder={t('pages.managers.namePlaceholder')}
                value={editManager.name}
                onIonInput={(e: any) => setEditManager({ ...editManager, name: e.detail.value! })}
              />
              <StyledInput
                label={t('pages.managers.login')}
                placeholder={t('pages.managers.loginPlaceholder')}
                value={editManager.login}
                onIonInput={(e: any) => setEditManager({ ...editManager, login: e.detail.value! })}
                marginBottom="24px"
              />
              <PrimaryButton onClick={handleEditManager} label={t('pages.managers.update')} />
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Trocar Senha */}
        <IonModal isOpen={showPasswordModal} onDidDismiss={() => setShowPasswordModal(false)}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#098947', '--color': '#fff' }}>
              <IonTitle>{t('pages.managers.changePassword')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPasswordModal(false)} style={{ color: '#fff' }}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px' }}>
              <StyledInput
                label={t('pages.managers.password')}
                placeholder={t('pages.managers.passwordPlaceholder')}
                value={newPassword.password}
                onIonInput={(e: any) => setNewPassword({ ...newPassword, password: e.detail.value! })}
                type="password"
              />
              <StyledInput
                label={t('pages.managers.confirmPassword')}
                placeholder={t('pages.managers.confirmPasswordPlaceholder')}
                value={newPassword.confirmPassword}
                onIonInput={(e: any) => setNewPassword({ ...newPassword, confirmPassword: e.detail.value! })}
                type="password"
                marginBottom="24px"
              />
              <PrimaryButton onClick={handleChangePassword} label={t('pages.managers.changePassword')} />
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Restringir Acesso */}
        <IonAlert
          isOpen={showRestrictAlert}
          onDidDismiss={() => setShowRestrictAlert(false)}
          header={t('common.confirm')}
          message={selectedManager?.restricted ? t('pages.managers.restoreAccess') + "?" : t('pages.managers.restrictAccess') + "?"}
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

export default Managers;
