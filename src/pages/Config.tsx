import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
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
  IonIcon,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { logOut, person, lockClosed, lockOpen, refresh, helpCircle } from 'ionicons/icons';
import { getCurrentUser, logout } from '../services/api';
import { useFechamentoControl } from '../hooks/useFechamentoControl';
import { useTranslation } from 'react-i18next';
// NOTE: Language selector temporarily disabled - only Spanish (es-CO) is available now
// import LanguageSelector from '../components/LanguageSelector';
import LocaleSelector from '../components/LocaleSelector';
import { translateRole } from '../utils/roleTranslation';

const Config: React.FC = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showBloqueioAlert, setShowBloqueioAlert] = useState(false);
  const { diaFechado, carregando } = useFechamentoControl();
  const history = useHistory();

  useEffect(() => {
    loadUser();
    
    // Configurar o refresher
    const setupRefresher = () => {
      const refresher = document.getElementById('config-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          await loadUser();
          refresher.complete();
        });
      }
    };

    // Usar setTimeout para garantir que o DOM esteja pronto
    setTimeout(setupRefresher, 100);
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  };

  const confirmLogout = async () => {
    try {
      await logout();
      history.replace('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleLogout = () => {
    if (user?.role === 'ROUTE' && diaFechado) {
      setShowBloqueioAlert(true);
      return;
    }
    setShowLogoutAlert(true);
  };

  if (carregando) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('config.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="config-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px' }}>
          {/* Card de Informações do Usuário */}
          <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={person} style={{ marginRight: '8px' }} />
                {t('config.userInfo')}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {user && (
                <>
                  <IonItem>
                    <IonLabel>
                      <h3>{t('config.name')}</h3>
                      <p>{user.name}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>{t('config.login')}</h3>
                      <p>{user.login}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>{t('config.type')}</h3>
                      <p>{translateRole(user.role, t)}</p>
                    </IonLabel>
                  </IonItem>
                </>
              )}
            </IonCardContent>
          </IonCard>

          {/* Card de País */}
          <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>
                {t('config.country')}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {/* NOTE: Language selector temporarily disabled - only Spanish (es-CO) is available now
              <LanguageSelector />
              */}
              <div style={{ marginTop: '16px' }}>
                <LocaleSelector />
              </div>
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
                  {t('config.systemStatus')}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonLabel>
                    <h3>{t('config.dayClosing')}</h3>
                    <p style={{ 
                      color: diaFechado ? '#dc3545' : '#28a745',
                      fontWeight: 'bold'
                    }}>
                      {diaFechado ? t('config.closed') : t('config.open')}
                    </p>
                  </IonLabel>
                </IonItem>
                {diaFechado && (
                  <IonItem>
                    <IonLabel>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        {t('config.systemBlocked')}
                      </p>
                    </IonLabel>
                  </IonItem>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Card de Suporte */}
          <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={helpCircle} style={{ marginRight: '8px' }} />
                {t('config.support')}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem 
                button 
                onClick={() => window.open(import.meta.env.VITE_SUPPORT_LINK, '_blank')}
                style={{ cursor: 'pointer' }}
              >
                <IonLabel>
                  <p style={{ color: '#007bff', fontSize: '14px' }}>
                    {t('config.reportError')}
                  </p>
                </IonLabel>
                <IonIcon icon={helpCircle} slot="end" color="primary" />
              </IonItem>
            </IonCardContent>
          </IonCard>

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
            {user?.role === 'ROUTE' && diaFechado ? t('config.logoutBlocked') : t('config.logoutButton')}
          </IonButton>
        </div>

        {/* Alert de Confirmação de Logout */}
        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header={t('alerts.confirmLogout')}
          message={t('config.confirmLogout')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('common.logout'),
              role: 'destructive',
              handler: confirmLogout
            }
          ]}
        />

        {/* Alert de Bloqueio de Logout */}
        <IonAlert
          isOpen={showBloqueioAlert}
          onDidDismiss={() => setShowBloqueioAlert(false)}
          header={t('config.logoutBlockedTitle')}
          message={t('config.logoutBlockedMessage')}
          buttons={[
            {
              text: t('config.understood'),
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Config;
