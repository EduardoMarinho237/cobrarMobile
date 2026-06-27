import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonAlert,
  IonIcon,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { logOut, helpCircle } from 'ionicons/icons';
import { getCurrentUser, logout } from '../services/api';
import { useFechamentoControl } from '../hooks/useFechamentoControl';
import { useTranslation } from 'react-i18next';
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
        <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
          <IonTitle>{t('config.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="config-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          {/* Card de Informações do Usuário - Profile Style */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '20px',
            marginBottom: '16px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
            overflow: 'hidden'
          }}>
            {/* Green header area */}
            <div style={{
              background: 'linear-gradient(135deg, #0c0989 0%, #1a17b5 100%)',
              padding: '32px 20px 40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              {user && (
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#fff' }}>
                    {user.name}
                  </h2>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#fff'
                  }}>
                    {translateRole(user.role, t)}
                  </span>
                </div>
              )}
            </div>

            {/* Info section - overlapping */}
            <div style={{
              margin: '-24px 16px 16px',
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '14px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              position: 'relative',
              zIndex: 2
            }}>
              {user && (
                <div>
                  <span style={{ fontSize: '11px', color: '#999', fontWeight: 500 }}>{t('config.login')}</span>
                  <p style={{ margin: '2px 0 0', fontSize: '15px', fontWeight: '600', color: '#262626' }}>
                    {user.login}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card de Suporte */}
          <button
            onClick={() => window.open(import.meta.env.VITE_SUPPORT_LINK, '_blank')}
            style={{
              width: '100%',
              padding: '18px 20px',
              border: 'none',
              backgroundColor: '#fff',
              borderRadius: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textAlign: 'center'
            }}
          >
            <IonIcon icon={helpCircle} style={{ fontSize: '20px', color: '#0c0989', flexShrink: 0 }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0c0989' }}>
              {t('config.reportError')}
            </span>
          </button>

          {/* Branding */}
          <div style={{
            background: 'linear-gradient(135deg, #0c0989 0%, #1a17b5 100%)',
            borderRadius: '20px',
            padding: '28px 24px',
            marginBottom: '16px',
            boxShadow: '0 4px 20px rgba(12,9,137,0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-20px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.08)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '-10px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{
                color: '#fff',
                fontSize: '32px',
                fontWeight: 'bold',
                margin: '0 0 4px 0',
                fontFamily: "'League Spartan', sans-serif",
                letterSpacing: '-1.5px'
              }}>
                abonopay <span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.7 }}>v{import.meta.env.VITE_APP_VERSION}</span>
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '13px',
                margin: 0,
                fontFamily: "'Futura', 'Century Gothic', 'Apple Gothic', sans-serif",
                fontWeight: 500
              }}>
                abono en la deuda, crecimiento en el bolsillo
              </p>
            </div>
          </div>

          {/* Botão de Logout */}
          <IonButton
            expand="block"
            onClick={handleLogout}
            disabled={user?.role === 'ROUTE' && diaFechado}
            style={{
              marginTop: '8px',
              '--background': user?.role === 'ROUTE' && diaFechado ? '#ccc' : '#eb445a',
              '--background-hover': user?.role === 'ROUTE' && diaFechado ? '#ccc' : '#d32f2f',
              '--border-radius': '14px',
              '--padding-top': '16px',
              '--padding-bottom': '16px',
              textTransform: 'none',
              fontWeight: '600',
              fontSize: '16px'
            }}
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
