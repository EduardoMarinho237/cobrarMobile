import React from 'react';
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

const Cobrancas: React.FC = () => {
  const handleRefresh = async (event: CustomEvent) => {
    // Simular carregamento
    setTimeout(() => {
      event.detail.complete();
    }, 1000);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cobranças</IonTitle>
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
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Cobranças</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Em desenvolvimento...</p>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Cobrancas;
