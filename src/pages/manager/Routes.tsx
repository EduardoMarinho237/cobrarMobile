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
import { createRoute, getRoutes, updateRoute, deleteRoute } from '../../services/routeApi';
import Toast from '../../components/Toast';

interface Route {
  id: number;
  name: string;
  login: string;
  role: string;
  lastAccess: string | null;
  restricted?: boolean;
}

const Routes: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRestrictAlert, setShowRestrictAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  
  // Form states
  const [newRoute, setNewRoute] = useState({ name: '', login: '', password: '', confirmPassword: '' });
  const [editRoute, setEditRoute] = useState({ name: '', login: '' });
  const [newPassword, setNewPassword] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const data = await getRoutes();
      const filteredData = data.filter((route: any) => route.role === 'ROUTE');
      setRoutes(filteredData.map((route: any) => ({ ...route, restricted: false })));
    } catch (error) {
      showToast('Erro ao carregar routes', 'danger');
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

  const handleCreateRoute = async () => {
    if (!validateFields(newRoute.name, newRoute.login, newRoute.password, newRoute.confirmPassword)) {
      return;
    }

    try {
      const response = await createRoute(newRoute.name, newRoute.login, newRoute.password);
      showToast(response.message, response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowCreateModal(false);
        setNewRoute({ name: '', login: '', password: '', confirmPassword: '' });
        loadRoutes();
      }
    } catch (error) {
      showToast('Erro ao criar route', 'danger');
    }
  };

  const handleEditRoute = () => {
    if (!validateFields(editRoute.name, editRoute.login)) {
      return;
    }

    if (!selectedRoute) return;

    updateRoute(selectedRoute.id, editRoute.name, editRoute.login)
      .then(response => {
        showToast(response.message, response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowEditModal(false);
          setEditRoute({ name: '', login: '' });
          setSelectedRoute(null);
          loadRoutes();
        }
      })
      .catch(() => {
        showToast('Erro ao atualizar route', 'danger');
      });
  };

  const handleDeleteRoute = () => {
    if (!selectedRoute) return;

    deleteRoute(selectedRoute.id)
      .then(response => {
        showToast(response.message, response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedRoute(null);
          loadRoutes();
        }
      })
      .catch(() => {
        showToast('Erro ao excluir route', 'danger');
      });
  };

  const openEditModal = (route: Route) => {
    setSelectedRoute(route);
    setEditRoute({ name: route.name, login: route.login });
    setShowEditModal(true);
  };

  const handleRestrictAccess = () => {
    if (selectedRoute) {
      setRoutes(routes.map(r => 
        r.id === selectedRoute.id ? { ...r, restricted: !r.restricted } : r
      ));
      showToast(selectedRoute.restricted ? 'Acesso restaurado' : 'Acesso restrito', 'success');
    }
    setShowRestrictAlert(false);
    setSelectedRoute(null);
  };

  const handleChangePassword = () => {
    if (!newPassword.password.trim()) {
      showToast('Senha não pode estar vazia', 'danger');
      return;
    }
    
    if (newPassword.password !== newPassword.confirmPassword) {
      showToast('Senhas não conferem', 'danger');
      return;
    }
    
    showToast('Senha alterada com sucesso', 'success');
    setShowPasswordModal(false);
    setNewPassword({ password: '', confirmPassword: '' });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca acessou';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Routes</IonTitle>
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
            Adicionar novo route
          </IonButton>

          {routes.map((route) => (
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
                          <h3>Login: {route.login}</h3>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Role: {route.role}</h3>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Último acesso: {formatDate(route.lastAccess)}</h3>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Clientes: 0</h3>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Caixa: $ 0,00</h3>
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
          ))}
        </div>

        {/* Modal Criar Route */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Novo Route</IonTitle>
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
                  value={newRoute.name}
                  onIonInput={(e: any) => setNewRoute({ ...newRoute, name: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Login</IonLabel>
                <IonInput
                  value={newRoute.login}
                  onIonInput={(e: any) => setNewRoute({ ...newRoute, login: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Senha</IonLabel>
                <IonInput
                  type="password"
                  value={newRoute.password}
                  onIonInput={(e: any) => setNewRoute({ ...newRoute, password: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Repetir Senha</IonLabel>
                <IonInput
                  type="password"
                  value={newRoute.confirmPassword}
                  onIonInput={(e: any) => setNewRoute({ ...newRoute, confirmPassword: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleCreateRoute}
                style={{ marginTop: '16px' }}
              >
                Criar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Route */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Editar Route</IonTitle>
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
                  value={editRoute.name}
                  onIonInput={(e: any) => setEditRoute({ ...editRoute, name: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="floating">Login</IonLabel>
                <IonInput
                  value={editRoute.login}
                  onIonInput={(e: any) => setEditRoute({ ...editRoute, login: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleEditRoute}
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
          message={selectedRoute?.restricted ? "Restaurar acesso?" : "Restringir acesso?"}
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

        {/* Alert Excluir Route */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirmar Exclusão"
          message={`Deseja realmente excluir o route ${selectedRoute?.name}?`}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Excluir',
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
