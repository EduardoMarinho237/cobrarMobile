import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonLoading
} from '@ionic/react';
import { getCurrentUser, login, logout, isDev } from '../services/api';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

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
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('common.login')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="6" sizeLg="4">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle className="ion-text-center">
                    {t('login.title')}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonInput
                      label={t('login.username')}
                      labelPlacement="floating"
                      placeholder={t('login.usernamePlaceholder')}
                      value={username}
                      onIonInput={(e: any) => setUsername(e.detail.value!)}
                    />
                  </IonItem>
                  <IonItem>
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
                    className="ion-margin-top"
                    onClick={handleLogin}
                  >
                    {t('login.loginButton')}
                  </IonButton>
                  {isDev() && (
                    <div className="ion-margin-top ion-text-center">
                      <IonItem>
                        <LanguageSelector />
                      </IonItem>
                      <small>
                        <strong>{t('login.testUsers')}</strong><br/>
                        admin/admin ({t('userRoles.ADMIN')})<br/>
                        manager/manager ({t('userRoles.MANAGER')})<br/>
                        route/route ({t('userRoles.ROUTE')})
                      </small>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
        
        {/* Language Selector na parte inferior */}
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '10px 20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '250px'
        }}>
          <LanguageSelector />
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
