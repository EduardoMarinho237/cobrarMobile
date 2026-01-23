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
  settings 
} from 'ionicons/icons';
import Cobrancas from './route/Cobrancas';
import Cobrados from './route/Cobrados';
import GastosRoute from './route/GastosRoute';
import Creditos from './route/Creditos';
import Fechamento from './route/Fechamento';
import Config from './Config';
import { useFechamentoControl } from '../hooks/useFechamentoControl';

const RouteTabs: React.FC = () => {
  const { diaFechado, podeAcessar, carregando } = useFechamentoControl();
  const [showBloqueioAlert, setShowBloqueioAlert] = React.useState(false);

  const handleTabBloqueada = () => {
    if (diaFechado) {
      setShowBloqueioAlert(true);
    }
  };

  if (carregando) {
    return <div>Carregando...</div>;
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
          {!diaFechado ? <GastosRoute /> : <Redirect to="/route/fechamento" />}
        </Route>
        <Route exact path="/route/creditos">
          {!diaFechado ? <Creditos /> : <Redirect to="/route/fechamento" />}
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
          <IonLabel>Cobranças</IonLabel>
        </IonTabButton>
        <IonTabButton 
          tab="cobrados" 
          href={diaFechado ? "#" : "/route/cobrados"}
          onClick={diaFechado ? handleTabBloqueada : undefined}
          disabled={diaFechado}
        >
          <IonIcon aria-hidden="true" icon={cash} />
          <IonLabel>Cobrados</IonLabel>
        </IonTabButton>
        <IonTabButton 
          tab="gastos" 
          href={diaFechado ? "#" : "/route/gastos"}
          onClick={diaFechado ? handleTabBloqueada : undefined}
          disabled={diaFechado}
        >
          <IonIcon aria-hidden="true" icon={wallet} />
          <IonLabel>Gastos</IonLabel>
        </IonTabButton>
        <IonTabButton 
          tab="creditos" 
          href={diaFechado ? "#" : "/route/creditos"}
          onClick={diaFechado ? handleTabBloqueada : undefined}
          disabled={diaFechado}
        >
          <IonIcon aria-hidden="true" icon={card} />
          <IonLabel>Créditos</IonLabel>
        </IonTabButton>
        <IonTabButton tab="fechamento" href="/route/fechamento">
          <IonIcon aria-hidden="true" icon={statsChart} />
          <IonLabel>Fechamento</IonLabel>
        </IonTabButton>
        <IonTabButton tab="config" href="/route/config">
          <IonIcon aria-hidden="true" icon={settings} />
          <IonLabel>Config</IonLabel>
        </IonTabButton>
      </IonTabBar>

      <IonAlert
        isOpen={showBloqueioAlert}
        onDidDismiss={() => setShowBloqueioAlert(false)}
        header="Acesso Bloqueado"
        message="O dia foi fechado. Esta funcionalidade não está disponível até as 00:00 do próximo dia."
        buttons={[
          {
            text: 'Entendido',
            role: 'cancel'
          }
        ]}
      />
    </IonTabs>
  );
};

export default RouteTabs;
