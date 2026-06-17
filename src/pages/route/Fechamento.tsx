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
  IonAlert,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/react';
import { cashOutline, peopleOutline, walletOutline, lockClosed, refresh, saveOutline } from 'ionicons/icons';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import {
  getFechamentoData,
  fecharDia,
  FechamentoData
} from '../../services/fechamentoApi';
import { getMyBalance } from '../../services/cashBoxApi';
import { generateRouteDailyTodayReport } from '../../services/reportApi';
import { buildDailyRoutePdf } from '../../utils/buildDailyRoutePdf';
import PdfViewerModal from '../../components/PdfViewerModal';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import { useFechamentoControl } from '../../hooks/useFechamentoControl';
import type jsPDF from 'jspdf';

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
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showBloqueadoAlert, setShowBloqueadoAlert] = useState(false);
  const [isClosingWithReport, setIsClosingWithReport] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  useEffect(() => {
    loadFechamentoData();
    loadCashBalance();
    // REMOVIDO: Não verifica mais status via API
    // O status agora vem do hook useFechamentoControl baseado no usuário logado

    // Configurar o refresher
    const setupRefresher = () => {
      const refresher = document.getElementById('fechamento-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          await loadFechamentoData();
          await loadCashBalance();
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
      showToast(t('pages.closing.errorLoadingData'), 'danger');
    }
  };

  const loadCashBalance = async () => {
    try {
      const balance = await getMyBalance();
      setCashBalance(balance);
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
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
        setTimeout(() => {
          window.location.replace('/route/fechamento');
        }, 1000);
      }
    } catch (error) {
      showToast(t('pages.closing.errorClosingDay'), 'danger');
    }
  };

  const confirmarFecharDiaComRelatorio = async () => {
    setIsClosingWithReport(true);
    try {
      const response = await fecharDia();
      showToast(response.message, response.success ? 'success' : 'danger');
      
      if (response.success) {
        try {
          const { report } = await generateRouteDailyTodayReport();
          const doc = buildDailyRoutePdf(report, t);
          const fileName = `relatorio-diario-${report.periodStart}.pdf`;
          setPdfDoc(doc);
          setPdfFileName(fileName);
          setShowPdfViewer(true);
        } catch (reportError) {
          console.error('Erro ao gerar relatório do dia:', reportError);
          showToast(t('pages.closing.reportGenerationError'), 'danger');
        }
        setTimeout(() => {
          window.location.replace('/route/fechamento');
        }, 1000);
      }
    } catch (error) {
      showToast(t('pages.closing.errorClosingDay'), 'danger');
    } finally {
      setIsClosingWithReport(false);
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
              {/* Card de Saldo em Caixa */}
              <IonCard style={{ marginBottom: '16px', borderRadius: '12px', border: `2px solid ${cashBalance >= 0 ? '#28a745' : '#dc3545'}` }}>
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={saveOutline} style={{ marginRight: '8px' }} />
                    {t('pages.closing.cashBoxTitle')}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 style={{ textAlign: 'center', color: cashBalance >= 0 ? '#28a745' : '#dc3545', margin: '0', fontSize: '28px', fontWeight: 'bold' }}>
                    {formatCurrencyWithSymbol(cashBalance)}
                  </h2>
                  <p style={{ textAlign: 'center', color: '#666', marginTop: '8px', fontSize: '14px' }}>
                    {cashBalance >= 0 ? t('pages.closing.cashBoxPositive') : t('pages.closing.cashBoxNegative')}
                  </p>
                  {fechamentoData && (
                    <p style={{ textAlign: 'center', color: '#888', marginTop: '4px', fontSize: '12px' }}>
                      {t('pages.closing.initialBalance')}: {formatCurrencyWithSymbol(fechamentoData.caixaInicial)}
                    </p>
                  )}
                </IonCardContent>
              </IonCard>

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
                disabled={isClosingWithReport}
                style={{ marginTop: '24px' }}
              >
                {isClosingWithReport ? (
                  <IonSpinner name="dots" slot="start" />
                ) : (
                  <IonIcon icon={lockClosed} slot="start" />
                )}
                {isClosingWithReport ? t('pages.closing.closing') : t('pages.closing.closeDay')}
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
            },
            {
              text: t('pages.closing.closeDayAndDownloadReport'),
              handler: confirmarFecharDiaComRelatorio
            }
          ]}
        />

        <PdfViewerModal
          isOpen={showPdfViewer}
          onClose={() => setShowPdfViewer(false)}
          doc={pdfDoc}
          fileName={pdfFileName}
          title={t('pages.reports.dailyReport')}
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
