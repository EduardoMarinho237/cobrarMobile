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
  IonRefresherContent
} from '@ionic/react';
import { add, eye, eyeOff, trash, key, create, refresh } from 'ionicons/icons';
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
      showToast('Erro ao carregar managers', 'danger');
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadManagers();
    event.detail.complete();
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
      
      // Usa a mensagem da API
      showToast(response.message || 'Manager criado com sucesso', response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowCreateModal(false);
        setNewManager({ name: '', login: '', password: '', confirmPassword: '' });
        loadManagers();
      }
    } catch (error) {
      console.error('Erro ao criar manager:', error);
      showToast('Erro de conexão, tente novamente', 'danger');
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
        showToast(response.message || 'Manager atualizado com sucesso', response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowEditModal(false);
          setEditManager({ name: '', login: '' });
          setSelectedManager(null);
          loadManagers();
        }
      })
      .catch((error) => {
        console.error('Erro ao atualizar manager:', error);
        showToast('Erro de conexão, tente novamente', 'danger');
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
      showToast(response.message || (newAppearOnAudit ? 'Acesso restaurado com sucesso' : 'Acesso restrito com sucesso'), 
                response.success ? 'success' : 'danger');
      
    } catch (error) {
      console.error('Erro ao alterar acesso:', error);
      showToast('Erro de conexão, tente novamente', 'danger');
      
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
      showToast('Senha não pode estar vazia', 'danger');
      return;
    }
    
    if (newPassword.password !== newPassword.confirmPassword) {
      showToast('Senhas não conferem', 'danger');
      return;
    }
    
    try {
      const response = await changeManagerPassword(selectedManager.id, newPassword.password);
      
      // Usa a mensagem da API
      showToast(response.message || 'Senha alterada com sucesso', response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowPasswordModal(false);
        setNewPassword({ password: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      showToast('Erro de conexão, tente novamente', 'danger');
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
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refresh}
            pullingText="Puxe para atualizar"
            refreshingSpinner="circles"
            refreshingText="Atualizando..."
          />
        </IonRefresher>
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
                <IonInput
                  label="Nome"
                  labelPlacement="floating"
                  placeholder="Digite o nome"
                  value={newManager.name}
                  onIonInput={(e: any) => setNewManager({ ...newManager, name: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Login"
                  labelPlacement="floating"
                  placeholder="Digite o login"
                  value={newManager.login}
                  onIonInput={(e: any) => setNewManager({ ...newManager, login: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Senha"
                  labelPlacement="floating"
                  placeholder="Digite a senha"
                  type="password"
                  value={newManager.password}
                  onIonInput={(e: any) => setNewManager({ ...newManager, password: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Repetir Senha"
                  labelPlacement="floating"
                  placeholder="Repita a senha"
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
                <IonInput
                  label="Nome"
                  labelPlacement="floating"
                  placeholder="Digite o nome"
                  value={editManager.name}
                  onIonInput={(e: any) => setEditManager({ ...editManager, name: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Login"
                  labelPlacement="floating"
                  placeholder="Digite o login"
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
                <IonInput
                  label="Nova Senha"
                  labelPlacement="floating"
                  placeholder="Digite a nova senha"
                  type="password"
                  value={newPassword.password}
                  onIonInput={(e: any) => setNewPassword({ ...newPassword, password: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Repetir Nova Senha"
                  labelPlacement="floating"
                  placeholder="Repita a nova senha"
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
