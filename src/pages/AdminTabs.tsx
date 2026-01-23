import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs
} from '@ionic/react';
import { people, settings } from 'ionicons/icons';
import Managers from './admin/Managers';
import Config from './Config';

const AdminTabs: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/admin/managers">
          <Managers />
        </Route>
        <Route exact path="/admin/config">
          <Config />
        </Route>
        <Route exact path="/admin">
          <Redirect to="/admin/managers" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="managers" href="/admin/managers">
          <IonIcon aria-hidden="true" icon={people} />
          <IonLabel>Managers</IonLabel>
        </IonTabButton>
        <IonTabButton tab="config" href="/admin/config">
          <IonIcon aria-hidden="true" icon={settings} />
          <IonLabel>Config</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default AdminTabs;
