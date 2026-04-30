import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonItem,
  IonAlert,
  IonLoading
} from '@ionic/react';
import { getCurrentUser, login, logout, isDev } from '../services/api';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// NOTE: Language selector temporarily disabled - only Spanish (es-CO) is available now
// import LanguageSelector from '../components/LanguageSelector';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();

  const handleLogin = async () => {
    if (!username || !password) {
      setAlertMessage(t('login.fillAllFields'));
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Tentando login com:', username);
      const userData = await login(username, password);
      console.log('Login successful:', userData);
      console.log('userData.role:', userData.role);
      
      if (!userData || !userData.role) {
        console.error('Dados do usuário incompletos:', userData);
        setAlertMessage(t('login.incompleteData'));
        setShowAlert(true);
        return;
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Dados salvos no localStorage');
      
      // Verifica se foi salvo corretamente
      const savedUser = localStorage.getItem('user');
      console.log('Verificando localStorage:', savedUser);
      
      // Pequeno delay para garantir que o localStorage foi atualizado
      setTimeout(() => {
        console.log('Redirecionando baseado no role:', userData.role);
        
        // Redirecionar diretamente baseado no role
        switch (userData.role) {
          case 'ADMIN':
            console.log('Redirecionando para /admin/managers');
            window.location.href = '/admin/managers';
            break;
          case 'MANAGER':
            console.log('Redirecionando para /manager/routes');
            window.location.href = '/manager/routes';
            break;
          case 'ROUTE':
            console.log('Redirecionando para /route/config');
            window.location.href = '/route/config';
            break;
          default:
            console.log('Role não reconhecido:', userData.role, 'voltando para login');
            setAlertMessage(t('login.userTypeNotRecognized'));
            setShowAlert(true);
            window.location.href = '/login';
        }
      }, 100);
    } catch (error) {
      console.error('Erro no login:', error);
      setAlertMessage(error instanceof Error ? error.message : t('login.loginError'));
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-no-padding">
        <div style={{
          minHeight: '100vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          margin: 0,
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '40px 30px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h1 style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '32px',
              fontWeight: 'bold',
              margin: '0 0 10px 0',
              fontFamily: 'Arial, sans-serif'
            }}>
              CobranzasApp
            </h1>
            <p style={{
              color: '#666',
              fontSize: '16px',
              margin: '0 0 40px 0',
              fontFamily: 'Arial, sans-serif'
            }}>
              su app de gestión de préstamos
            </p>
            
            <IonItem style={{ marginBottom: '20px', '--background': 'transparent' }}>
              <IonInput
                label={t('login.username')}
                labelPlacement="floating"
                placeholder={t('login.usernamePlaceholder')}
                value={username}
                onIonInput={(e: any) => setUsername(e.detail.value!)}
              />
            </IonItem>
            
            <IonItem style={{ marginBottom: '30px', '--background': 'transparent' }}>
              <IonInput
                label={t('login.password')}
                labelPlacement="floating"
                placeholder={t('login.passwordPlaceholder')}
                type="password"
                value={password}
                onIonInput={(e: any) => setPassword(e.detail.value!)}
              />
            </IonItem>
            
            <IonButton
              expand="block"
              style={{ 
                marginBottom: '20px',
                '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '--background-hover': 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
              }}
              onClick={handleLogin}
            >
              {t('login.loginButton')}
            </IonButton>
            
            {isDev() && (
              <div style={{ marginTop: '20px' }}>
                <small style={{ color: '#666' }}>
                  <strong>{t('login.testUsers')}</strong><br/>
                  admin/admin ({t('userRoles.ADMIN')})<br/>
                  manager/manager ({t('userRoles.MANAGER')})<br/>
                  route/route ({t('userRoles.ROUTE')})
                </small>
              </div>
            )}
          </div>
          
          {/* NOTE: Language selector temporarily disabled - only Spanish (es-CO) is available now
          <div style={{
            marginTop: '30px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '15px 25px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <LanguageSelector />
          </div>
          */}
        </div>
        
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={t('alerts.error')}
          message={alertMessage}
          buttons={[t('common.ok')]}
        />
        <IonLoading isOpen={isLoading} message={t('login.loggingIn')} />
      </IonContent>
    </IonPage>
  );
};

export default Login;
