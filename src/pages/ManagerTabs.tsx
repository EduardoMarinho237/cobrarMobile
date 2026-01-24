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
import { barChart, wallet, map, settings } from 'ionicons/icons';
import Dashboard from './manager/Dashboard';
import Gastos from './manager/Gastos';
import Routes from './manager/Routes';
import Config from './Config';
import { useTranslation } from 'react-i18next';

const ManagerTabs: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/manager/dashboard">
          <Dashboard />
        </Route>
        <Route exact path="/manager/gastos">
          <Gastos />
        </Route>
        <Route exact path="/manager/routes">
          <Routes />
        </Route>
        <Route exact path="/manager/config">
          <Config />
        </Route>
        <Route exact path="/manager">
          <Redirect to="/manager/routes" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="dashboard" href="/manager/dashboard">
          <IonIcon aria-hidden="true" icon={barChart} />
          <IonLabel>{t('tabs.dashboard')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="gastos" href="/manager/gastos">
          <IonIcon aria-hidden="true" icon={wallet} />
          <IonLabel>{t('tabs.expenses')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="routes" href="/manager/routes">
          <IonIcon aria-hidden="true" icon={map} />
          <IonLabel>{t('tabs.routes')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="config" href="/manager/config">
          <IonIcon aria-hidden="true" icon={settings} />
          <IonLabel>{t('common.config')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default ManagerTabs;
