import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonIcon, IonButton, IonSpinner } from '@ionic/react';
import { cog, logOut, refresh } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { logout, apiRequest } from '../../services/api';

const SundayBlocked: React.FC = () => {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleCheckAvailability = async () => {
    setChecking(true);
    try {
      const response = await apiRequest('/api/public/health', { method: 'GET' });
      // Se a requisição passou sem ser interceptada pelo sunday-maintenance,
      // significa que não é mais domingo (ou dev mode está ativo)
      if (response && response.success) {
        window.location.replace('/');
      }
    } catch {
      // Se deu erro ou sunday-maintenance, permanece na tela
    } finally {
      setChecking(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.sundayBlocked.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
          <IonCard style={{ borderRadius: '12px', textAlign: 'center' }}>
            <IonCardContent>
              <IonIcon 
                icon={cog} 
                style={{ fontSize: '64px', color: '#6c757d', marginBottom: '16px' }}
              />
              <h2 style={{ color: '#6c757d', marginBottom: '16px' }}>
                {t('pages.sundayBlocked.maintenance')}
              </h2>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                {t('pages.sundayBlocked.maintenanceMessage')}
              </p>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                {t('pages.sundayBlocked.onlyAvailable')}
              </p>
              <IonButton
                expand="block"
                shape="round"
                onClick={handleCheckAvailability}
                disabled={checking}
                style={{ marginBottom: '12px' }}
              >
                {checking ? (
                  <IonSpinner name="dots" slot="start" />
                ) : (
                  <IonIcon icon={refresh} slot="start" />
                )}
                {t('pages.sundayBlocked.checkAvailability')}
              </IonButton>
              <IonButton
                expand="block"
                shape="round"
                color="medium"
                onClick={handleLogout}
              >
                <IonIcon icon={logOut} slot="start" />
                {t('pages.sundayBlocked.logout')}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SundayBlocked;
