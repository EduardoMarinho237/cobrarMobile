import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonSpinner
} from '@ionic/react';
import { analytics, construct } from 'ionicons/icons';

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula carregamento
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px' }}>
          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: '300px',
              gap: '16px'
            }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', fontSize: '14px' }}>Carregando dashboard...</p>
            </div>
          ) : (
            <IonCard style={{ borderRadius: '12px', textAlign: 'center' }}>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={analytics} style={{ marginRight: '8px', fontSize: '24px' }} />
                  Dashboard
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div style={{ padding: '40px 20px' }}>
                  <IonIcon icon={construct} style={{ fontSize: '64px', color: '#666', marginBottom: '20px' }} />
                  <h2 style={{ color: '#666', margin: '0 0 16px 0' }}>Em Desenvolvimento</h2>
                  <p style={{ color: '#999', margin: 0, lineHeight: '1.5' }}>
                    O dashboard está sendo construído com recursos avançados de análise de dados.<br />
                    Em breve você terá acesso a métricas detalhadas e relatórios personalizados.
                  </p>
                </div>
              </IonCardContent>
            </IonCard>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
