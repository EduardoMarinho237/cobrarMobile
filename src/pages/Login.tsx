import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonItem,
  IonAlert,
  IonLoading,
  IonCheckbox
} from '@ionic/react';
import { login } from '../services/api';
import { useTranslation } from 'react-i18next';
import { isSundayBlocked } from '../utils/sundayUtil';
// NOTE: Language selector temporarily disabled - only Spanish (es-CO) is available now
// import LanguageSelector from '../components/LanguageSelector';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setAlertMessage(t('login.fillAllFields'));
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Tentando login com:', username);
      const userData = await login(username, password, rememberMe);
      console.log('Login successful:', userData);
      console.log('userData.role:', userData.role);
      
      if (!userData || !userData.role) {
        console.error('Dados do usuário incompletos:', userData);
        setAlertMessage(t('login.incompleteData'));
        setShowAlert(true);
        return;
      }
      
      // Salvar dados usando as mesmas chaves do useAuth.ts
      localStorage.setItem('auth_token', userData.token || '');
      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('auth_role', userData.role || '');
      localStorage.setItem('auth_user_id', userData.id?.toString() || '');
      localStorage.setItem('auth_login_time', Date.now().toString());
      
      // Manter compatibilidade com código existente
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('Dados salvos no localStorage');
      
      // Verifica se foi salvo corretamente
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('auth_token');
      console.log('Verificando localStorage (user):', savedUser);
      console.log('Verificando localStorage (token):', savedToken);
      
      // Pequeno delay para garantir que o localStorage foi atualizado
      setTimeout(() => {
        console.log('Redirecionando baseado no role:', userData.role);
        
        // Redirecionar diretamente baseado no role
        switch (userData.role) {
          case 'ADMIN':
            console.log('Redirecionando para /admin/managers');
            window.location.href = '/admin/managers';
            break;
          case 'MANAGER': {
            const managerRedirect = isSundayBlocked() ? '/manager/reports' : '/manager/routes';
            console.log('Redirecionando para', managerRedirect);
            window.location.href = managerRedirect;
            break;
          }
          case 'ROUTE':
            // Verificar closedDay do userData E do localStorage
            const closedDayFromResponse = userData.closedDay === true;
            const closedDayStr = localStorage.getItem('closedDay');
            const closedDayFromStorage = closedDayStr === 'true';
            const isClosedDay = closedDayFromResponse || closedDayFromStorage;

            console.log('ROUTE login - closedDay from response:', closedDayFromResponse, 'from storage:', closedDayFromStorage);

            if (isClosedDay) {
              console.log('Dia fechado, redirecionando para /route/fechamento');
              window.location.href = '/route/fechamento';
            } else {
              console.log('Redirecionando para /route/config');
              window.location.href = '/route/config';
            }
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
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f0f0f0',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Happy people decorative image */}
          <img
            src="/images/happy-business-people.png"
            alt="Satisfied customers"
            style={{
              position: 'absolute',
              bottom: '-25px',
              right: '-70px',
width: '380px',
              height: 'auto',
              pointerEvents: 'none',
              opacity: 0.85,
              zIndex: 0
            }}
          />
          {/* Top green section with branding */}
          <div style={{
            background: '#0c0989',
            padding: '60px 28px 80px 28px',
            borderBottomLeftRadius: '40px',
            borderBottomRightRadius: '40px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-40px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.07)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }} />
            <div style={{
              position: 'absolute',
              top: '30px',
              right: '100px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.06)'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{
                color: '#fff',
                fontSize: '44px',
                fontWeight: 'bold',
                margin: '0 0 6px 0',
                fontFamily: "'League Spartan', sans-serif",
                letterSpacing: '-2px'
              }}>
                abonopay
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '14px',
                margin: 0,
                fontFamily: "'Futura', 'Century Gothic', 'Apple Gothic', sans-serif",
                fontWeight: 500
              }}>
                abono en la deuda, crecimiento en el bolsillo
              </p>
            </div>
          </div>

          {/* Form card */}
          <div style={{
            margin: '-50px 20px 0 20px',
            backgroundColor: '#fff',
            borderRadius: '24px',
            padding: '32px 24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Username input */}
            <IonItem style={{
              marginBottom: '16px',
              '--background': '#f5f5f5',
              '--border-radius': '14px',
              '--padding-start': '20px',
              '--inner-padding-end': '20px',
              '--min-height': '58px',
              '--highlight-color-focused': '#0c0989',
              '--highlight-color-valid': '#0c0989'
            }}>
              <IonInput
                label={t('login.username')}
                labelPlacement="floating"
                placeholder={t('login.usernamePlaceholder')}
                value={username}
                onIonInput={(e: any) => setUsername(e.detail.value!)}
              />
            </IonItem>

            {/* Password input */}
            <IonItem style={{
              marginBottom: '12px',
              '--background': '#f5f5f5',
              '--border-radius': '14px',
              '--padding-start': '20px',
              '--inner-padding-end': '20px',
              '--min-height': '58px',
              '--highlight-color-focused': '#0c0989',
              '--highlight-color-valid': '#0c0989'
            }}>
              <IonInput
                label={t('login.password')}
                labelPlacement="floating"
                placeholder={t('login.passwordPlaceholder')}
                type={showPassword ? "text" : "password"}
                value={password}
                onIonInput={(e: any) => setPassword(e.detail.value!)}
              />
            </IonItem>

            {/* Show Password */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px',
              paddingLeft: '4px'
            }}>
              <IonCheckbox
                checked={showPassword}
                onIonChange={(e) => setShowPassword(e.detail.checked)}
                labelPlacement="end"
                style={{
                  '--checkbox-background-checked': '#0c0989',
                  '--border-color-checked': '#0c0989',
                  '--checkmark-color': '#fff',
                  '--size': '22px'
                }}
              >
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {t('login.showPassword')}
                </span>
              </IonCheckbox>
            </div>

            {/* Remember Me */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '32px',
              paddingLeft: '4px'
            }}>
              <IonCheckbox
                checked={rememberMe}
                onIonChange={(e) => setRememberMe(e.detail.checked)}
                labelPlacement="end"
                style={{
                  '--checkbox-background-checked': '#0c0989',
                  '--border-color-checked': '#0c0989',
                  '--checkmark-color': '#fff',
                  '--size': '22px'
                }}
              >
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {t('login.rememberMe')}
                </span>
              </IonCheckbox>
            </div>

            {/* Login Button */}
            <IonButton
              expand="block"
              style={{
                '--background': '#0c0989',
                '--background-hover': '#08066a',
                '--border-radius': '14px',
                '--font-weight': 'bold',
                '--padding-top': '16px',
                '--padding-bottom': '16px',
                fontSize: '16px',
                textTransform: 'none'
              }}
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? t('login.loggingIn') : t('login.loginButton')}
            </IonButton>
          </div>

          {/* Footer */}
          <div style={{
            padding: '24px 20px 24px 44px',
            textAlign: 'left'
          }}>
            <p style={{
              fontSize: '12px',
              color: '#aaa',
              margin: 0,
              fontFamily: "'Futura', 'Century Gothic', 'Apple Gothic', sans-serif",
              fontWeight: 500
            }}>
              abonopay · v{import.meta.env.VITE_APP_VERSION}
            </p>
          </div>
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
