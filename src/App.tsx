import { Redirect, Route } from 'react-router-dom';
import { IonApp, setupIonicReact, IonAlert, IonToast } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import AdminTabs from './pages/AdminTabs';
import ManagerTabs from './pages/ManagerTabs';
import RouteTabs from './pages/RouteTabs';
import EditarCategoria from './pages/manager/EditarCategoria';
import DetalhesGastos from './pages/manager/DetalhesGastos';
import SundayBlocked from './pages/route/SundayBlocked';
import { getCurrentUser, setAppUpdateCallback, checkToken, clearSessionData, setAppUpdateBlocked } from './services/api';
import { isSunday } from './utils/sundayUtil';
import AppUpdateScreen from './components/AppUpdateScreen';

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

import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);

  // 🔵 TOAST GLOBAL STATE (ADICIONADO)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setSessionChecked(true);
        return;
      }

      const isValid = await checkToken();
      if (!isValid) {
        clearSessionData();
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
      setSessionChecked(true);
    };

    validateSession();
  }, []);

  useEffect(() => {
    console.log('App - Registrando callback de atualização');
    setAppUpdateCallback((message: string, url: string) => {
      console.log('App - Callback de atualização chamado:', { message, url });
      setUpdateMessage(message);
      setDownloadUrl(url);
      setAppUpdateBlocked(true);
      setShowUpdateAlert(true);
    });
  }, []);

  // 🔵 CALLBACK GLOBAL DO TOAST (ADICIONADO)
  useEffect(() => {
    console.log('App - Registrando callback de toast global');

    (window as any).globalToast = (message: string) => {
      console.log('App - Toast global chamado:', message);
      setToastMessage(message);
      setShowToast(true);
    };
  }, []);

  const handleUpdateDismiss = () => {
    setShowUpdateAlert(false);
    setAppUpdateBlocked(false);
  };

  const checkAuth = () => {
    const user = getCurrentUser();
    return user !== null;
  };

  const getRedirectPath = () => {
    const user = getCurrentUser();
    if (!user) return '/login';

    switch (user.role) {
      case 'ADMIN':
        return '/admin/managers';
      case 'MANAGER':
        return isSunday() ? '/manager/reports' : '/manager/routes';
      case 'ROUTE':
        return '/route/config';
      default:
        return '/login';
    }
  };

  const ProtectedRoute: React.FC<{ children: React.ReactNode; path?: string; exact?: boolean }> =
    ({ children, ...rest }) => {
      if (!sessionChecked) {
        return null;
      }

      const isAuth = checkAuth();

      if (!isAuth) {
        return <Redirect to="/login" />;
      }

      const user = getCurrentUser();
      const isDevMode = import.meta.env.VITE_DEV_MODE === 'TRUE';
      if (user?.role === 'MANAGER' && isSunday() && !isDevMode) {
        const currentPath = rest.path || '';
        if (currentPath.startsWith('/manager') && !currentPath.includes('/manager/reports') && !currentPath.includes('/manager/config')) {
          return <Redirect to="/manager/reports" />;
        }
      }

      return <Route {...rest}>{children}</Route>;
    };

  return (
    <IonApp>
      <IonReactRouter>
        <Route exact path="/login">
          <Login />
        </Route>

        <Route exact path="/sunday-blocked">
          <SundayBlocked />
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

        <ProtectedRoute exact path="/admin/api-keys">
          <AdminTabs />
        </ProtectedRoute>

        <ProtectedRoute exact path="/admin/transactions">
          <AdminTabs />
        </ProtectedRoute>

        <ProtectedRoute exact path="/manager">
          <ManagerTabs />
        </ProtectedRoute>

        <ProtectedRoute exact path="/manager/reports">
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

        <ProtectedRoute exact path="/route/reports">
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
          {checkAuth()
            ? <Redirect to={getRedirectPath()} />
            : <Redirect to="/login" />
          }
        </Route>
      </IonReactRouter>

      {/* TELA CHEIA DE UPDATE */}
      {showUpdateAlert && (
        <AppUpdateScreen
          message={updateMessage}
          downloadUrl={downloadUrl}
          onDismiss={handleUpdateDismiss}
        />
      )}

      {/* 🔵 TOAST GLOBAL (ADICIONADO) */}
      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={2500}
        position="top"
        color="danger"
        onDidDismiss={() => setShowToast(false)}
      />
    </IonApp>
  );
};

export default App;