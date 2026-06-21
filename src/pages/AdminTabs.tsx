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
import { people, settings, key, cash } from 'ionicons/icons';
import Managers from './admin/Managers';
import Config from './Config';
import ApiKeys from './admin/ApiKeys';
import Transactions from './admin/Transactions';
import { useTranslation } from 'react-i18next';

const AdminTabs: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/admin/managers">
          <Managers />
        </Route>
        <Route exact path="/admin/config">
          <Config />
        </Route>
        <Route exact path="/admin/api-keys">
          <ApiKeys />
        </Route>
        <Route exact path="/admin/transactions">
          <Transactions />
        </Route>
        <Route exact path="/admin">
          <Redirect to="/admin/managers" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="managers" href="/admin/managers">
          <IonIcon aria-hidden="true" icon={people} />
          <IonLabel>{t('tabs.managers')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="api-keys" href="/admin/api-keys">
          <IonIcon aria-hidden="true" icon={key} />
          <IonLabel>{t('tabs.apiKeys')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="transactions" href="/admin/transactions">
          <IonIcon aria-hidden="true" icon={cash} />
          <IonLabel>{t('tabs.transactions')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="config" href="/admin/config">
          <IonIcon aria-hidden="true" icon={settings} />
          <IonLabel>{t('common.config')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default AdminTabs;
