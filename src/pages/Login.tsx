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
import { login } from '../services/api';
import { useHistory } from 'react-router-dom';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();

  const handleLogin = async () => {
    if (!username || !password) {
      setAlertMessage('Preencha todos os campos');
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
        setAlertMessage('Dados incompletos recebidos do servidor');
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
            setAlertMessage('Tipo de usuário não reconhecido');
            setShowAlert(true);
            window.location.href = '/login';
        }
      }, 100);
    } catch (error) {
      console.error('Erro no login:', error);
      setAlertMessage(error instanceof Error ? error.message : 'Erro ao fazer login');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="6" sizeLg="4">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle className="ion-text-center">
                    Cobrar Mobile
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonInput
                      label="Usuário"
                      labelPlacement="floating"
                      placeholder="Digite o usuário"
                      value={username}
                      onIonInput={(e: any) => setUsername(e.detail.value!)}
                    />
                  </IonItem>
                  <IonItem>
                    <IonInput
                      label="Senha"
                      labelPlacement="floating"
                      placeholder="Digite a senha"
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
                    Entrar
                  </IonButton>
                  <div className="ion-margin-top ion-text-center">
                    <small>
                      <strong>Usuários de teste:</strong><br/>
                      admin/admin (ADMIN)<br/>
                      manager/manager (MANAGER)<br/>
                      route/route (ROUTE)
                    </small>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Erro"
          message={alertMessage}
          buttons={['OK']}
        />
        <IonLoading isOpen={isLoading} message="Fazendo login..." />
      </IonContent>
    </IonPage>
  );
};

export default Login;
