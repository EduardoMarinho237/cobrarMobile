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
  IonIcon,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { lockOpen, lockClosed, cashOutline, peopleOutline, walletOutline, refresh } from 'ionicons/icons';
import { 
  getFechamentoData, 
  fecharDia, 
  FechamentoData 
} from '../../services/fechamentoApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import { useFechamentoControl } from '../../hooks/useFechamentoControl';

const Fechamento: React.FC = () => {
  const { t } = useTranslation();
  const { diaFechado } = useFechamentoControl(); // Usar hook para status de fechamento
  const [fechamentoData, setFechamentoData] = useState<FechamentoData | null>(null);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showBloqueadoAlert, setShowBloqueadoAlert] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  useEffect(() => {
    loadFechamentoData();
    // REMOVIDO: Não verifica mais status via API
    // O status agora vem do hook useFechamentoControl baseado no usuário logado
    
    // Configurar o refresher
    const setupRefresher = () => {
      const refresher = document.getElementById('fechamento-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          await loadFechamentoData();
          refresher.complete();
        });
      }
    };

    // Usar setTimeout para garantir que o DOM esteja pronto
    setTimeout(setupRefresher, 100);
  }, []);

  const loadFechamentoData = async () => {
    try {
      const data = await getFechamentoData();
      setFechamentoData(data);
    } catch (error) {
      showToast('Erro ao carregar dados do fechamento', 'danger');
    }
  };

  // REMOVIDO: Função verificarStatusFechamento não é mais necessária
  // const verificarStatusFechamento = async () => { ... };

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
        // REMOVIDO: setDiaFechado(true) - o estado é gerenciado pelo hook
        // Redirecionar para a mesma página para aplicar restrições
        setTimeout(() => {
          window.location.replace('/route/fechamento');
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
                  {t('pages.closing.onlyAvailableTabs')}
                </p>
              </IonCardContent>
            </IonCard>
          </div>

          <IonAlert
            isOpen={showBloqueadoAlert}
            onDidDismiss={() => setShowBloqueadoAlert(false)}
            header={t('pages.closing.systemBlocked')}
            message={t('pages.closing.blockedMessage')}
            buttons={[
              {
                text: t('config.understood'),
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
          <IonTitle>{t('pages.closing.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="fechamento-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px' }}>
          {fechamentoData && (
            <>
              {/* Card de Expectativa */}
              <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={cashOutline} style={{ marginRight: '8px' }} />
                    {t('pages.closing.collectionExpectation')}
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
                    {t('pages.closing.dayCollection')}
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
                          {t('pages.closing.collectedClients')}
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
                          {t('pages.closing.dayExpenses')}
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
                {t('pages.closing.closeDay')}
              </IonButton>
            </>
          )}
        </div>

        {/* Alert de Confirmação */}
        <IonAlert
          isOpen={showConfirmAlert}
          onDidDismiss={() => setShowConfirmAlert(false)}
          header={t('pages.closing.confirmClosing')}
          message={t('pages.closing.confirmClosingMessage')}
          buttons={[
            {
              text: t('pages.closing.cancel'),
              role: 'cancel'
            },
            {
              text: t('pages.closing.closeDay'),
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
