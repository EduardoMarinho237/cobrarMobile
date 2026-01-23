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
  IonAlert,
  IonIcon
} from '@ionic/react';
import { logOut, person, lockClosed, lockOpen } from 'ionicons/icons';
import { getCurrentUser, logout } from '../services/api';
import { useFechamentoControl } from '../hooks/useFechamentoControl';

const Config: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showBloqueioAlert, setShowBloqueioAlert] = useState(false);
  const { diaFechado, carregando } = useFechamentoControl();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  };

  const handleLogout = () => {
    if (user?.role === 'ROUTE' && diaFechado) {
      setShowBloqueioAlert(true);
      return;
    }
    setShowLogoutAlert(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (carregando) {
    return <div>Carregando...</div>;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Configurações</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px' }}>
          {/* Card de Informações do Usuário */}
          <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={person} style={{ marginRight: '8px' }} />
                Informações do Usuário
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {user && (
                <>
                  <IonItem>
                    <IonLabel>
                      <h3>Nome</h3>
                      <p>{user.name}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>Login</h3>
                      <p>{user.login}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>Tipo</h3>
                      <p>{user.type}</p>
                    </IonLabel>
                  </IonItem>
                </>
              )}
            </IonCardContent>
          </IonCard>

          {/* Card de Status do Sistema - Apenas para ROTAS */}
          {user?.role === 'ROUTE' && (
            <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon 
                    icon={diaFechado ? lockClosed : lockOpen} 
                    style={{ marginRight: '8px' }} 
                  />
                  Status do Sistema
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonLabel>
                    <h3>Fechamento do Dia</h3>
                    <p style={{ 
                      color: diaFechado ? '#dc3545' : '#28a745',
                      fontWeight: 'bold'
                    }}>
                      {diaFechado ? 'FECHADO' : 'ABERTO'}
                    </p>
                  </IonLabel>
                </IonItem>
                {diaFechado && (
                  <IonItem>
                    <IonLabel>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        O sistema está bloqueado até as 00:00 do próximo dia.
                      </p>
                    </IonLabel>
                  </IonItem>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Botão de Logout */}
          <IonButton
            expand="block"
            shape="round"
            color={user?.role === 'ROUTE' && diaFechado ? 'medium' : 'danger'}
            onClick={handleLogout}
            disabled={user?.role === 'ROUTE' && diaFechado}
            style={{ marginTop: '24px' }}
          >
            <IonIcon icon={logOut} slot="start" />
            {user?.role === 'ROUTE' && diaFechado ? 'Logout Bloqueado' : 'Sair do Sistema'}
          </IonButton>
        </div>

        {/* Alert de Confirmação de Logout */}
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Confirmar Logout"
          message="Tem certeza que deseja sair do sistema?"
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Sair',
              role: 'destructive',
              handler: confirmLogout
            }
          ]}
        />

        {/* Alert de Bloqueio de Logout */}
        <IonAlert
          isOpen={showBloqueioAlert}
          onDidDismiss={() => setShowBloqueioAlert(false)}
          header="Logout Bloqueado"
          message="O dia foi fechado. Não é possível fazer logout até as 00:00 do próximo dia."
          buttons={[
            {
              text: 'Entendido',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Config;
