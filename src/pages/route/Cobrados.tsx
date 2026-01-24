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
  IonRefresherContent
} from '@ionic/react';
import { refresh } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';

const Cobrados: React.FC = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    // Configurar o refresher
    const setupRefresher = () => {
      const refresher = document.getElementById('cobrados-refresher') as HTMLIonRefresherElement;
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
          <IonTitle>{t('pages.collected.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="cobrados-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{t('pages.collected.title')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>{t('pages.collected.inDevelopment')}</p>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Cobrados;
