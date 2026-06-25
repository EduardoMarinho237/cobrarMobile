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
import { 
  receipt, 
  wallet, 
  statsChart, 
  settings,
  people,
  document
} from 'ionicons/icons';
import Cobrancas from './route/Cobrancas';
import Expenses from './route/Expenses';
import Fechamento from './route/Fechamento';
import Clients from './route/Clients';
import Config from './Config';
import RouteReports from './route/RouteReports';
import { useTranslation } from 'react-i18next';

const RouteTabs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/route/cobrancas">
          <Cobrancas />
        </Route>
        <Route exact path="/route/gastos">
          <Expenses />
        </Route>
        <Route exact path="/route/clients">
          <Clients />
        </Route>
        <Route exact path="/route/fechamento">
          <Fechamento />
        </Route>
        <Route exact path="/route/config">
          <Config />
        </Route>
        <Route exact path="/route/reports">
          <RouteReports />
        </Route>
        <Route exact path="/route">
          <Redirect to="/route/cobrancas" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom" color="primary">
        <IonTabButton tab="cobrancas" href="/route/cobrancas">
          <IonIcon aria-hidden="true" icon={receipt} />
          <IonLabel>{t('tabs.collections')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="gastos" href="/route/gastos">
          <IonIcon aria-hidden="true" icon={wallet} />
          <IonLabel>{t('tabs.expenses')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="clients" href="/route/clients">
          <IonIcon aria-hidden="true" icon={people} />
          <IonLabel>{t('tabs.clients')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="fechamento" href="/route/fechamento">
          <IonIcon aria-hidden="true" icon={statsChart} />
          <IonLabel>{t('tabs.closing')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="reports" href="/route/reports">
          <IonIcon aria-hidden="true" icon={document} />
          <IonLabel>{t('tabs.reports')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="config" href="/route/config">
          <IonIcon aria-hidden="true" icon={settings} />
          <IonLabel>{t('common.config')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default RouteTabs;
