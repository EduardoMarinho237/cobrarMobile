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
import { cashOutline, peopleOutline, walletOutline, lockClosed, refresh } from 'ionicons/icons';
import { formatCurrencyWithSymbol } from '../../utils/currency';
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
  const { diaFechado, carregando, verificando, verificarStatus } = useFechamentoControl(); // Usar hook para status de fechamento
  
  // Estado visual: mantém o estado atual durante a verificação
  const [estadoVisual, setEstadoVisual] = useState(diaFechado);
  
  // Atualiza o estado visual quando o hook muda (mas não durante verificação)
  useEffect(() => {
    if (!verificando) {
      setEstadoVisual(diaFechado);
    }
  }, [diaFechado, verificando]);
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

  const handleVerificarLiberacao = async () => {
    try {
      // Usa a função do hook para verificar status na API
      await verificarStatus();
      
      // Mostra mensagem de sucesso
      showToast(t('pages.closing.verifyingLiberation'), 'primary');
      
      // Se o dia foi aberto, a interface vai atualizar automaticamente
      // Se ainda estiver fechado, continua mostrando a tela de bloqueio
    } catch (error) {
      showToast(t('pages.closing.errorVerifyingLiberation'), 'danger');
    }
  };


  if (estadoVisual) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('pages.closing.title')}</IonTitle>
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
                  {t('pages.closing.dayClosed')}
                </h2>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  {t('pages.closing.blockedMessage')}
                </p>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  {t('pages.closing.onlyAvailableTabs')}
                </p>
                <IonButton
                  expand="block"
                  shape="round"
                  fill="outline"
                  onClick={handleVerificarLiberacao}
                  disabled={verificando || carregando}
                  style={{ marginTop: '16px' }}
                >
                  <IonIcon icon={refresh} slot="start" />
                  {verificando || carregando ? t('pages.closing.verifying') : t('pages.closing.verifyLiberation')}
                </IonButton>
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
                    {formatCurrencyWithSymbol(fechamentoData.expectativaArrecadacao)}
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
                    {formatCurrencyWithSymbol(fechamentoData.arrecadacaoDia)}
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
                          {formatCurrencyWithSymbol(fechamentoData.gastosDia)}
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
