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
import BlockedScreen, { BlockedType } from './components/ui/BlockedScreen';
import { getCurrentUser, setAppUpdateCallback, setClosedDayCallback, checkToken, clearSessionData, setAppUpdateBlocked, logout } from './services/api';
import { isSunday } from './utils/sundayUtil';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);

  // BLOCKED SCREEN STATE (Sunday, ClosedDay)
  const [showBlockedAlert, setShowBlockedAlert] = useState(false);
  const [blockedType, setBlockedType] = useState<BlockedType>('sunday');

  // 🔵 TOAST GLOBAL STATE (ADICIONADO)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Registrar callback antes de validar sessão, para capturar "closed-day" no interceptor
    setClosedDayCallback((isClosed: boolean) => {
      if (isClosed) {
        setBlockedType('closedDay');
        setShowBlockedAlert(true);
      } else {
        setShowBlockedAlert(false);
      }
    });

    const validateSession = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setSessionChecked(true);
        return;
      }

      const isValid = await checkToken();
      if (!isValid) {
        // Verificar se o erro é por dia fechado - se sim, não fazer logout
        const closedDayStr = localStorage.getItem('closedDay');
        const isClosedDay = closedDayStr === 'true';
        if (!isClosedDay) {
          clearSessionData();
          if (window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        } else {
          console.log('Dia fechado detectado, mantendo sessão para acesso à tela de fechamento');
        }
      }
      setSessionChecked(true);
    };

    validateSession();
  }, []);

  // Verificar Sunday e ClosedDay para mostrar BlockedScreen
  useEffect(() => {
    if (!sessionChecked) return;

    const user = getCurrentUser();
    if (!user) return;

    const isDevMode = !!import.meta.env.VITE_DEV_MODE;

    // Verificar se é domingo e não é dev mode
    if (user.role === 'MANAGER' && isSunday() && !isDevMode) {
      setBlockedType('sunday');
      setShowBlockedAlert(true);
      return;
    }

    // Verificar se dia está fechado
    const closedDayStr = localStorage.getItem('closedDay');
    const isClosedDay = closedDayStr === 'true' || user.closedDay === true;
    if (isClosedDay && user.role === 'ROUTE') {
      setBlockedType('closedDay');
      setShowBlockedAlert(true);
      return;
    }
  }, [sessionChecked]);

  useEffect(() => {
    console.log('App - Registrando callback de atualização');
    setAppUpdateCallback((message: string, url: string) => {
      console.log('App - Callback de atualização chamado:', { message, url });
      setUpdateMessage(message);
      setDownloadUrl(url);
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

  const handleBlockedLogout = async () => {
    await logout();
  };

  const handleBlockedAction = () => {
    if (blockedType === 'sunday') {
      // Para domingo, recarrega a página para verificar se ainda é domingo
      window.location.reload();
    } else if (blockedType === 'closedDay') {
      // Para dia fechado, recarrega para verificar se foi aberto
      window.location.reload();
    }
  };

  const checkAuth = () => {
    const user = getCurrentUser();
    return user !== null;
  };

  const getRedirectPath = () => {
    const user = getCurrentUser();
    if (!user) return '/login';

    // Verificar se o dia está fechado
    const closedDayStr = localStorage.getItem('closedDay');
    const isClosedDay = closedDayStr === 'true' || user.closedDay === true;

    switch (user.role) {
      case 'ADMIN':
        return '/admin/managers';
      case 'MANAGER':
        return isSunday() ? '/manager/reports' : '/manager/routes';
      case 'ROUTE':
        return isClosedDay ? '/route/fechamento' : '/route/config';
      default:
        return '/login';
    }
  };

  const ProtectedRoute: React.FC<{ children: React.ReactNode; path?: string; exact?: boolean }> =
    ({ children, ...rest }) => {
      if (!sessionChecked || showUpdateAlert || showBlockedAlert) {
        return null;
      }

      const isAuth = checkAuth();

      if (!isAuth) {
        return <Redirect to="/login" />;
      }

      const user = getCurrentUser();
      const isDevMode = !!import.meta.env.VITE_DEV_MODE;
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
        <BlockedScreen
          type="update"
          title={t('pages.blockedScreen.titleUpdate')}
          message={updateMessage}
          downloadUrl={downloadUrl}
          onAction={() => {
            if (downloadUrl) {
              window.open(downloadUrl, '_system');
            }
          }}
          onLogout={logout}
        />
      )}

      {/* TELA CHEIA DE BLOCKED (Sunday ou ClosedDay) */}
      {showBlockedAlert && (
        <BlockedScreen
          type={blockedType}
          title={blockedType === 'sunday' ? t('pages.blockedScreen.titleSunday') : t('pages.blockedScreen.titleClosedDay')}
          message={blockedType === 'sunday' ? t('pages.blockedScreen.messageSunday') : t('pages.blockedScreen.messageClosedDay')}
          subtitle={blockedType === 'sunday' ? t('pages.blockedScreen.subtitleSunday') : t('pages.blockedScreen.subtitleClosedDay')}
          onAction={handleBlockedAction}
          onLogout={handleBlockedLogout}
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
