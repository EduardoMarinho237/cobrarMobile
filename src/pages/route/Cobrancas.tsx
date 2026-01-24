import React, { useEffect } from 'react';
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
  IonRefresher,
  IonRefresherContent,
  IonIcon
} from '@ionic/react';
import { refresh } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';

const Cobrancas: React.FC = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    // Configurar o refresher
    const setupRefresher = () => {
      const refresher = document.getElementById('cobrancas-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', () => {
          // Simular carregamento
          setTimeout(() => {
            refresher.complete();
          }, 1000);
        });
      }
    };

    setTimeout(setupRefresher, 100);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.collections.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="cobrancas-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{t('pages.collections.title')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>{t('pages.collections.inDevelopment')}</p>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Cobrancas;
