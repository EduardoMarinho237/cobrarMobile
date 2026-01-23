import React, { useState, useEffect } from 'react';
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
  IonButton,
  IonItem,
  IonLabel,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon
} from '@ionic/react';
import { lockOpen, lockClosed, cashOutline, peopleOutline, walletOutline } from 'ionicons/icons';
import { 
  getFechamentoData, 
  fecharDia, 
  verificarFechamento,
  FechamentoData 
} from '../../services/fechamentoApi';
import Toast from '../../components/Toast';

const Fechamento: React.FC = () => {
  const [fechamentoData, setFechamentoData] = useState<FechamentoData | null>(null);
  const [diaFechado, setDiaFechado] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showBloqueadoAlert, setShowBloqueadoAlert] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  useEffect(() => {
    loadFechamentoData();
    verificarStatusFechamento();
  }, []);

  const loadFechamentoData = async () => {
    try {
      const data = await getFechamentoData();
      setFechamentoData(data);
    } catch (error) {
      showToast('Erro ao carregar dados do fechamento', 'danger');
    }
  };

  const verificarStatusFechamento = async () => {
    try {
      const status = await verificarFechamento();
      setDiaFechado(status.diaFechado);
    } catch (error) {
      console.error('Erro ao verificar status do fechamento:', error);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handleFecharDia = () => {
    setShowConfirmAlert(true);
  };

  const confirmarFecharDia = async () => {
    try {
      const response = await fecharDia();
      showToast(response.message, response.success ? 'success' : 'danger');
      
      if (response.success) {
        setDiaFechado(true);
        // Forçar reload da página para aplicar restrições
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      showToast('Erro ao fechar o dia', 'danger');
    }
  };

  const handleAcessoBloqueado = () => {
    setShowBloqueadoAlert(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (diaFechado) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Fechamento</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div style={{ padding: '16px' }}>
            <IonCard style={{ borderRadius: '12px', textAlign: 'center' }}>
              <IonCardContent>
                <IonIcon 
                  icon={lockClosed} 
                  style={{ fontSize: '64px', color: '#dc3545', marginBottom: '16px' }}
                />
                <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>
                  Dia Fechado
                </h2>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  O sistema está bloqueado até as 00:00 do próximo dia.
                </p>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Apenas as abas Config e Fechamento estão disponíveis.
                </p>
              </IonCardContent>
            </IonCard>
          </div>

          <IonAlert
            isOpen={showBloqueadoAlert}
            onDidDismiss={() => setShowBloqueadoAlert(false)}
            header="Sistema Bloqueado"
            message="O dia foi fechado. O sistema estará disponível novamente a partir das 00:00 do próximo dia."
            buttons={[
              {
                text: 'Entendido',
                role: 'cancel'
              }
            ]}
          />

          <Toast
            isOpen={toast.isOpen}
            message={toast.message}
            color={toast.color}
            onDidDismiss={() => setToast({ ...toast, isOpen: false })}
          />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Fechamento</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px' }}>
          {fechamentoData && (
            <>
              {/* Card de Expectativa */}
              <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={cashOutline} style={{ marginRight: '8px' }} />
                    Expectativa de Arrecadação do Dia
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 style={{ textAlign: 'center', color: '#28a745', margin: '0' }}>
                    {formatCurrency(fechamentoData.expectativaArrecadacao)}
                  </h2>
                </IonCardContent>
              </IonCard>

              {/* Card de Arrecadação */}
              <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={walletOutline} style={{ marginRight: '8px' }} />
                    Arrecadação do Dia
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 style={{ textAlign: 'center', color: '#007bff', margin: '0' }}>
                    {formatCurrency(fechamentoData.arrecadacaoDia)}
                  </h2>
                </IonCardContent>
              </IonCard>

              {/* Cards de Clientes e Gastos */}
              <IonGrid>
                <IonRow>
                  <IonCol size="6">
                    <IonCard style={{ borderRadius: '12px' }}>
                      <IonCardHeader>
                        <IonCardTitle style={{ fontSize: '16px' }}>
                          <IonIcon icon={peopleOutline} style={{ marginRight: '8px' }} />
                          Clientes Cobrados
                        </IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <h3 style={{ textAlign: 'center', color: '#6f42c1', margin: '0' }}>
                          {fechamentoData.clientesCobrados}
                        </h3>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                  <IonCol size="6">
                    <IonCard style={{ borderRadius: '12px' }}>
                      <IonCardHeader>
                        <IonCardTitle style={{ fontSize: '16px' }}>
                          <IonIcon icon={walletOutline} style={{ marginRight: '8px' }} />
                          Gastos do Dia
                        </IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <h3 style={{ textAlign: 'center', color: '#dc3545', margin: '0' }}>
                          {formatCurrency(fechamentoData.gastosDia)}
                        </h3>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </IonGrid>

              {/* Botão Fechar Dia */}
              <IonButton
                expand="block"
                shape="round"
                color="danger"
                onClick={handleFecharDia}
                style={{ marginTop: '24px' }}
              >
                <IonIcon icon={lockClosed} slot="start" />
                Fechar Dia
              </IonButton>
            </>
          )}
        </div>

        {/* Alert de Confirmação */}
        <IonAlert
          isOpen={showConfirmAlert}
          onDidDismiss={() => setShowConfirmAlert(false)}
          header="Confirmar Fechamento"
          message="Tem certeza que deseja fechar o dia? Após o fechamento, você não poderá mais acessar outras funcionalidades do sistema até as 00:00 do próximo dia."
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Fechar Dia',
              role: 'destructive',
              handler: confirmarFecharDia
            }
          ]}
        />

        {/* Toast */}
        <Toast
          isOpen={toast.isOpen}
          message={toast.message}
          color={toast.color}
          onDidDismiss={() => setToast({ ...toast, isOpen: false })}
        />
      </IonContent>
    </IonPage>
  );
};

export default Fechamento;
