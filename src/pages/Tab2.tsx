import React, { useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonRefresher, IonRefresherContent } from '@ionic/react';
import { refresh } from 'ionicons/icons';
import ExploreContainer from '../components/ExploreContainer';
import './Tab2.css';

const Tab2: React.FC = () => {
  useEffect(() => {
    const setupRefresher = () => {
      const refresher = document.getElementById('tab2-refresher') as HTMLIonRefresherElement;
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
          <IonTitle>Tab 2</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="tab2-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tab 2</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ExploreContainer name="Tab 2 page" />
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
