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

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setAlertMessage('Preencha todos os campos');
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = await login(username, password);
      
      localStorage.setItem('user', JSON.stringify(userData));
      window.location.href = '/dashboard';
    } catch (error) {
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
