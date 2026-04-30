import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonIcon, IonButton } from '@ionic/react';
import { lockClosed, logOut } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { logout } from '../../services/api';

const Blocked: React.FC = () => {
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.blocked.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
          <IonCard style={{ borderRadius: '12px', textAlign: 'center' }}>
            <IonCardContent>
              <IonIcon 
                icon={lockClosed} 
                style={{ fontSize: '64px', color: '#dc3545', marginBottom: '16px' }}
              />
              <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>
                {t('pages.blocked.userBlocked')}
              </h2>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                {t('pages.blocked.blockedMessage')}
              </p>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                {t('pages.blocked.onlyLogoutAvailable')}
              </p>
              <IonButton
                expand="block"
                shape="round"
                onClick={handleLogout}
                style={{ marginBottom: '16px' }}
              >
                <IonIcon icon={logOut} slot="start" />
                {t('pages.blocked.logout')}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Blocked;
