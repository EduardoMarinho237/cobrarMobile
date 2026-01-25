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

const Debitos: React.FC = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    // Configurar o refresher
    const setupRefresher = () => {
      const refresher = document.getElementById('debitos-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          // Simular recarregamento de dados
          await new Promise(resolve => setTimeout(resolve, 1000));
          refresher.complete();
        });
      }
    };

    // Usar setTimeout para garantir que o DOM esteja pronto
    setTimeout(setupRefresher, 100);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Débitos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="debitos-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Débitos</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Funcionalidade de débitos em desenvolvimento...</p>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Debitos;
