import { Redirect, Route } from 'react-router-dom';
import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminTabs from './pages/AdminTabs';
import ManagerTabs from './pages/ManagerTabs';
import RouteTabs from './pages/RouteTabs';
import EditarCategoria from './pages/manager/EditarCategoria';
import DetalhesGastos from './pages/manager/DetalhesGastos';
import { getCurrentUser } from './services/api';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const checkAuth = () => {
    return getCurrentUser() !== null;
  };

  const ProtectedRoute: React.FC<{ children: React.ReactNode; path?: string; exact?: boolean }> = ({ children, ...rest }) => {
    return (
      <Route {...rest}>
        {checkAuth() ? children : <Redirect to="/login" />}
      </Route>
    );
  };

  return (
    <IonApp>
      <IonReactRouter>
        <Route exact path="/login">
          <Login />
        </Route>
        <Route exact path="/dashboard">
          <Dashboard />
        </Route>
        <ProtectedRoute exact path="/admin">
          <AdminTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/admin/managers">
          <AdminTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/admin/config">
          <AdminTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/manager">
          <ManagerTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/manager/dashboard">
          <ManagerTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/manager/gastos">
          <ManagerTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/manager/routes">
          <ManagerTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/manager/config">
          <ManagerTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/route">
          <RouteTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/route/cobrancas">
          <RouteTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/route/cobrados">
          <RouteTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/route/gastos">
          <RouteTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/route/creditos">
          <RouteTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/route/fechamento">
          <RouteTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/route/config">
          <RouteTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/manager/gastos/:categoriaId/editar">
          <EditarCategoria />
        </ProtectedRoute>
        <ProtectedRoute exact path="/manager/gastos/:categoriaId/detalhes">
          <DetalhesGastos />
        </ProtectedRoute>
        <Route exact path="/">
          {checkAuth() ? <Redirect to="/dashboard" /> : <Redirect to="/login" />}
        </Route>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
