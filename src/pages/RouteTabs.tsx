import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonAlert
} from '@ionic/react';
import { 
  receipt, 
  cash, 
  wallet, 
  card, 
  statsChart, 
  settings,
  people
} from 'ionicons/icons';
import Cobrancas from './route/Cobrancas';
import Cobrados from './route/Cobrados';
import Expenses from './route/Expenses';
import Credits from './route/Credits';
import Fechamento from './route/Fechamento';
import Clients from './route/Clients';
import Config from './Config';
import { useFechamentoControl } from '../hooks/useFechamentoControl';
import { useTranslation } from 'react-i18next';

const RouteTabs: React.FC = () => {
  const { t } = useTranslation();
  const { diaFechado, podeAcessar, carregando } = useFechamentoControl();
  const [showBloqueioAlert, setShowBloqueioAlert] = React.useState(false);

  const handleTabBloqueada = () => {
    if (diaFechado) {
      setShowBloqueioAlert(true);
    }
  };

  if (carregando) {
    return <div>{t('common.loading')}</div>;
  }

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/route/cobrancas">
          {!diaFechado ? <Cobrancas /> : <Redirect to="/route/fechamento" />}
        </Route>
        <Route exact path="/route/cobrados">
          {!diaFechado ? <Cobrados /> : <Redirect to="/route/fechamento" />}
        </Route>
        <Route exact path="/route/gastos">
          {!diaFechado ? <Expenses /> : <Redirect to="/route/fechamento" />}
        </Route>
        <Route exact path="/route/credits">
          {!diaFechado ? <Credits /> : <Redirect to="/route/fechamento" />}
        </Route>
        <Route exact path="/route/clients">
          {!diaFechado ? <Clients /> : <Redirect to="/route/fechamento" />}
        </Route>
        <Route exact path="/route/fechamento">
          <Fechamento />
        </Route>
        <Route exact path="/route/config">
          <Config />
        </Route>
        <Route exact path="/route">
          <Redirect to={diaFechado ? "/route/fechamento" : "/route/cobrancas"} />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton 
          tab="cobrancas" 
          href={diaFechado ? "#" : "/route/cobrancas"}
          onClick={diaFechado ? handleTabBloqueada : undefined}
          disabled={diaFechado}
        >
          <IonIcon aria-hidden="true" icon={receipt} />
          <IonLabel>{t('tabs.collections')}</IonLabel>
        </IonTabButton>
        <IonTabButton 
          tab="cobrados" 
          href={diaFechado ? "#" : "/route/cobrados"}
          onClick={diaFechado ? handleTabBloqueada : undefined}
          disabled={diaFechado}
        >
          <IonIcon aria-hidden="true" icon={cash} />
          <IonLabel>{t('tabs.collected')}</IonLabel>
        </IonTabButton>
        <IonTabButton 
          tab="gastos" 
          href={diaFechado ? "#" : "/route/gastos"}
          onClick={diaFechado ? handleTabBloqueada : undefined}
          disabled={diaFechado}
        >
          <IonIcon aria-hidden="true" icon={wallet} />
          <IonLabel>{t('tabs.expenses')}</IonLabel>
        </IonTabButton>
        <IonTabButton 
          tab="credits" 
          href={diaFechado ? "#" : "/route/credits"}
          onClick={diaFechado ? handleTabBloqueada : undefined}
          disabled={diaFechado}
        >
          <IonIcon aria-hidden="true" icon={card} />
          <IonLabel>{t('tabs.credits')}</IonLabel>
        </IonTabButton>
        <IonTabButton 
          tab="clients" 
          href={diaFechado ? "#" : "/route/clients"}
          onClick={diaFechado ? handleTabBloqueada : undefined}
          disabled={diaFechado}
        >
          <IonIcon aria-hidden="true" icon={people} />
          <IonLabel>Clientes</IonLabel>
        </IonTabButton>
        <IonTabButton tab="fechamento" href="/route/fechamento">
          <IonIcon aria-hidden="true" icon={statsChart} />
          <IonLabel>{t('tabs.closing')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="config" href="/route/config">
          <IonIcon aria-hidden="true" icon={settings} />
          <IonLabel>{t('common.config')}</IonLabel>
        </IonTabButton>
      </IonTabBar>

      <IonAlert
        isOpen={showBloqueioAlert}
        onDidDismiss={() => setShowBloqueioAlert(false)}
        header={t('routeTabs.accessBlocked')}
        message={t('routeTabs.dayClosedMessage')}
        buttons={[
          {
            text: t('routeTabs.understood'),
            role: 'cancel'
          }
        ]}
      />
    </IonTabs>
  );
};

export default RouteTabs;
