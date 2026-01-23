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
  IonCol
} from '@ionic/react';
import { add, eye, eyeOff, trash, key, create } from 'ionicons/icons';
import { createManager, getManagers, updateManager, toggleManagerAudit, changeManagerPassword } from '../../services/api';
import Toast from '../../components/Toast';

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
      const data = await getManagers();
      setManagers(data.map((manager: any) => ({ 
        ...manager, 
        restricted: !manager.appearOnAudit 
      })));
    } catch (error) {
      showToast('Erro ao carregar managers', 'danger');
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const validateFields = (name: string, login: string, password?: string, confirmPassword?: string) => {
    if (!name.trim()) {
      showToast('Nome não pode estar vazio', 'danger');
      return false;
    }
    
    if (!login.trim()) {
      showToast('Login não pode estar vazio', 'danger');
      return false;
    }
    
    if (login.includes(' ')) {
      showToast('Login não pode conter espaços', 'danger');
      return false;
    }
    
    if (password !== undefined && confirmPassword !== undefined) {
      if (!password.trim()) {
        showToast('Senha não pode estar vazia', 'danger');
        return false;
      }
      
      if (password !== confirmPassword) {
        showToast('Senhas não conferem', 'danger');
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
      
      // Se a API retornar o objeto do manager (status 201)
      if (response && response.id) {
        showToast('Manager criado com sucesso!', 'success');
        setShowCreateModal(false);
        setNewManager({ name: '', login: '', password: '', confirmPassword: '' });
        loadManagers();
      } else {
        // Se retornar o formato antigo (mock)
        showToast(response.message, response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowCreateModal(false);
          setNewManager({ name: '', login: '', password: '', confirmPassword: '' });
          loadManagers();
        }
      }
    } catch (error) {
      showToast('Erro ao criar manager', 'danger');
    }
  };

  const handleEditManager = () => {
    if (!validateFields(editManager.name, editManager.login)) {
      return;
    }

    if (!selectedManager) return;

    updateManager(selectedManager.id, editManager.name, editManager.login)
      .then(response => {
        showToast(response.message, response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowEditModal(false);
          setEditManager({ name: '', login: '' });
          setSelectedManager(null);
          loadManagers();
        }
      })
      .catch(() => {
        showToast('Erro ao atualizar manager', 'danger');
      });
  };

  const openEditModal = (manager: Manager) => {
    setSelectedManager(manager);
    setEditManager({ name: manager.name, login: manager.login });
    setShowEditModal(true);
  };

  const handleRestrictAccess = async () => {
    if (!selectedManager) return;

    try {
      const newAppearOnAudit = !selectedManager.appearOnAudit;
      const response = await toggleManagerAudit(selectedManager.id, newAppearOnAudit);
      
      if (response && response.id) {
        // API real - atualiza o estado local
        setManagers(managers.map(m => 
          m.id === selectedManager.id ? { ...m, appearOnAudit: newAppearOnAudit, restricted: !newAppearOnAudit } : m
        ));
        showToast(newAppearOnAudit ? 'Acesso restaurado com sucesso' : 'Acesso restrito com sucesso', 'success');
      } else {
        // Mock - usa a resposta
        showToast(response.message, response.success ? 'success' : 'danger');
        if (response.success) {
          setManagers(managers.map(m => 
            m.id === selectedManager.id ? { ...m, appearOnAudit: newAppearOnAudit, restricted: !newAppearOnAudit } : m
          ));
        }
      }
    } catch (error) {
      showToast('Erro ao alterar acesso', 'danger');
    }
    
    setShowRestrictAlert(false);
    setSelectedManager(null);
  };

  const handleChangePassword = async () => {
    if (!selectedManager) return;
    
    if (!newPassword.password.trim()) {
      showToast('Senha não pode estar vazia', 'danger');
      return;
    }
    
    if (newPassword.password !== newPassword.confirmPassword) {
      showToast('Senhas não conferem', 'danger');
      return;
    }
    
    try {
      const response = await changeManagerPassword(selectedManager.id, newPassword.password);
      
      if (response && response.id) {
        // API real
        showToast('Senha alterada com sucesso', 'success');
      } else {
        // Mock
        showToast(response.message, response.success ? 'success' : 'danger');
      }
      
      if (response.success || response.id) {
        setShowPasswordModal(false);
        setNewPassword({ password: '', confirmPassword: '' });
      }
    } catch (error) {
      showToast('Erro ao alterar senha', 'danger');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca acessou';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Managers</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px' }}>
          <IonButton 
            expand="block" 
            shape="round" 
            onClick={() => setShowCreateModal(true)}
            style={{ marginBottom: '16px' }}
          >
            <IonIcon slot="start" icon={add} />
            Adicionar novo manager
          </IonButton>

          {managers.map((manager) => (
            <IonCard 
              key={manager.id} 
              style={{ 
                opacity: manager.restricted ? 0.6 : 1,
                marginBottom: '16px',
                borderRadius: '12px'
              }}
            >
              <IonCardHeader>
                <IonCardTitle>{manager.name}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Login: {manager.login}</h3>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Role: {manager.role}</h3>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Último acesso: {formatDate(manager.lastAccess)}</h3>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Rotas: {manager.routeCount || 0}</h3>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Caixa: $ {(manager.cashBalance || 0).toFixed(2)}</h3>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol size="3">
                      <IonButton
                        fill="clear"
                        onClick={() => openEditModal(manager)}
                      >
                        <IonIcon icon={create} />
                      </IonButton>
                    </IonCol>
                    <IonCol size="3">
                      <IonButton
                        fill="clear"
                        onClick={() => {
                          setSelectedManager(manager);
                          setShowRestrictAlert(true);
                        }}
                      >
                        <IonIcon icon={manager.restricted ? eyeOff : eye} />
                      </IonButton>
                    </IonCol>
                    <IonCol size="3">
                      <IonButton
                        fill="clear"
                        onClick={() => {
                          setSelectedManager(manager);
                          setShowPasswordModal(true);
                        }}
                      >
                        <IonIcon icon={key} />
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
          ))}
        </div>

        {/* Modal Criar Manager */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Novo Manager</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="floating">Nome</IonLabel>
                <IonInput
                  value={newManager.name}
                  onIonInput={(e: any) => setNewManager({ ...newManager, name: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Login</IonLabel>
                <IonInput
                  value={newManager.login}
                  onIonInput={(e: any) => setNewManager({ ...newManager, login: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Senha</IonLabel>
                <IonInput
                  type="password"
                  value={newManager.password}
                  onIonInput={(e: any) => setNewManager({ ...newManager, password: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Repetir Senha</IonLabel>
                <IonInput
                  type="password"
                  value={newManager.confirmPassword}
                  onIonInput={(e: any) => setNewManager({ ...newManager, confirmPassword: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleCreateManager}
                style={{ marginTop: '16px' }}
              >
                Criar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Manager */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Editar Manager</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="floating">Nome</IonLabel>
                <IonInput
                  value={editManager.name}
                  onIonInput={(e: any) => setEditManager({ ...editManager, name: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Login</IonLabel>
                <IonInput
                  value={editManager.login}
                  onIonInput={(e: any) => setEditManager({ ...editManager, login: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleEditManager}
                style={{ marginTop: '16px' }}
              >
                Salvar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Trocar Senha */}
        <IonModal isOpen={showPasswordModal} onDidDismiss={() => setShowPasswordModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Trocar Senha</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPasswordModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="floating">Nova Senha</IonLabel>
                <IonInput
                  type="password"
                  value={newPassword.password}
                  onIonInput={(e: any) => setNewPassword({ ...newPassword, password: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Repetir Nova Senha</IonLabel>
                <IonInput
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
                Alterar Senha
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Restringir Acesso */}
        <IonAlert
          isOpen={showRestrictAlert}
          onDidDismiss={() => setShowRestrictAlert(false)}
          header="Confirmar"
          message={selectedManager?.restricted ? "Restaurar acesso?" : "Restringir acesso?"}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Confirmar',
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
