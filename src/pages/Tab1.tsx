import React, { useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonRefresher, IonRefresherContent } from '@ionic/react';
import { refresh } from 'ionicons/icons';
import ExploreContainer from '../components/ExploreContainer';
import './Tab1.css';

const Tab1: React.FC = () => {
  useEffect(() => {
    const setupRefresher = () => {
      const refresher = document.getElementById('tab1-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          // Simular recarregamento de dados
          await new Promise(resolve => setTimeout(resolve, 1000));
          refresher.complete();
        });
      }
    };

    setTimeout(setupRefresher, 100);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tab 1</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="tab1-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tab 1</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ExploreContainer name="Tab 1 page" />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
