import { Redirect, Route } from 'react-router-dom';
import { IonApp, setupIonicReact, IonAlert } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import AdminTabs from './pages/AdminTabs';
import ManagerTabs from './pages/ManagerTabs';
import RouteTabs from './pages/RouteTabs';
import EditarCategoria from './pages/manager/EditarCategoria';
import DetalhesGastos from './pages/manager/DetalhesGastos';
import { getCurrentUser, setAppUpdateCallback } from './services/api';

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
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(() => {
    // Registrar callback para quando o app estiver desatualizado
    console.log('App - Registrando callback de atualização');
    setAppUpdateCallback((message: string, url: string) => {
      console.log('App - Callback de atualização chamado:', { message, url });
      setUpdateMessage(message);
      setDownloadUrl(url);
      setShowUpdateAlert(true);
      console.log('App - Estado atualizado, showUpdateAlert deve ser true');
    });
  }, []);

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
    setShowUpdateAlert(false);
  };

  const checkAuth = () => {
    const user = getCurrentUser();
    console.log('checkAuth - user from localStorage:', user);
    return user !== null;
  };

  const getRedirectPath = () => {
    const user = getCurrentUser();
    if (!user) return '/login';
    
    switch (user.role) {
      case 'ADMIN':
        return '/admin/managers';
      case 'MANAGER':
        return '/manager/routes';
      case 'ROUTE':
        return '/route/config';
      default:
        return '/login';
    }
  };

  const ProtectedRoute: React.FC<{ children: React.ReactNode; path?: string; exact?: boolean }> = ({ children, ...rest }) => {
    const isAuth = checkAuth();
    console.log('ProtectedRoute checkAuth:', isAuth, 'path:', rest.path);
    console.log('ProtectedRoute - user completo:', getCurrentUser());
    
    if (!isAuth) {
      console.log('ProtectedRoute - não autenticado, redirecionando para /login');
      return <Redirect to="/login" />;
    }
    
    console.log('ProtectedRoute - autenticado, renderizando children');
    return (
      <Route {...rest}>
        {children}
      </Route>
    );
  };

  return (
    <IonApp>
      <IonReactRouter>
        <Route exact path="/login">
          <Login />
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
        <ProtectedRoute exact path="/route/credits">
          <RouteTabs />
        </ProtectedRoute>
        <ProtectedRoute exact path="/route/clients">
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
          {checkAuth() ? <Redirect to={getRedirectPath()} /> : <Redirect to="/login" />}
        </Route>
      </IonReactRouter>

      {/* Alert de Atualização do App */}
      <IonAlert
        isOpen={showUpdateAlert}
        onDidDismiss={() => setShowUpdateAlert(false)}
        header={updateMessage}
        buttons={[
          {
            text: 'Download',
            handler: handleDownload,
          },
        ]}
        backdropDismiss={false}
      />
    </IonApp>
  );
};

export default App;
