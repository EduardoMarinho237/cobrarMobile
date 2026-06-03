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
  IonRefresherContent,
  IonSpinner
} from '@ionic/react';
import { cashOutline, peopleOutline, walletOutline, lockClosed, refresh, downloadOutline } from 'ionicons/icons';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import { translateRole } from '../../utils/roleTranslation';
import { 
  getFechamentoData, 
  fecharDia, 
  FechamentoData 
} from '../../services/fechamentoApi';
import { getDebits, Debit } from '../../services/debitApi';
import { getExpenses, Expense } from '../../services/expenseApi';
import { getCurrentUser } from '../../services/api';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import { useFechamentoControl } from '../../hooks/useFechamentoControl';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [showReportTypeAlert, setShowReportTypeAlert] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
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

  const getStartOfTodayInTimezone = (timezone: string): Date => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')!.value;
    const month = parts.find(p => p.type === 'month')!.value;
    const day = parts.find(p => p.type === 'day')!.value;
    return new Date(`${year}-${month}-${day}T00:00:00`);
  };

  const formatDateTimeForReport = (date: Date, timezone: string): string => {
    return date.toLocaleString('pt-BR', {
      timeZone: timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleDownloadReport = () => {
    setShowReportTypeAlert(true);
  };

  const generateReport = async (type: 'collections' | 'expenses' | 'both') => {
    setIsGeneratingReport(true);
    setShowReportTypeAlert(false);
    try {
      const user = getCurrentUser();
      if (!user) {
        showToast(t('pages.closing.reportGenerationError'), 'danger');
        setIsGeneratingReport(false);
        return;
      }

      const timezone = localStorage.getItem('timezone') || 'America/Sao_Paulo';
      const startOfToday = getStartOfTodayInTimezone(timezone);
      const now = new Date();

      let todayDebits: Debit[] = [];
      let todayExpenses: Expense[] = [];

      if (type === 'collections' || type === 'both') {
        const allDebits = await getDebits();
        todayDebits = allDebits.filter((d: Debit) => new Date(d.createdAt) >= startOfToday);
        todayDebits.sort((a: Debit, b: Debit) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }

      if (type === 'expenses' || type === 'both') {
        const allExpenses = await getExpenses();
        todayExpenses = allExpenses.filter((e: Expense) => new Date(e.createdAt) >= startOfToday);
        todayExpenses.sort((a: Expense, b: Expense) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      let titleKey = 'reportTitle';
      if (type === 'expenses') titleKey = 'reportExpensesTitle';
      if (type === 'both') titleKey = 'reportBalanceTitle';

      doc.setFontSize(16);
      doc.setTextColor(33, 37, 41);
      doc.text(t(`pages.closing.${titleKey}`), pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(108, 117, 125);
      doc.text(`${t('pages.closing.reportGeneratedAt')}: ${formatDateTimeForReport(now, timezone)}`, pageWidth / 2, 27, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(33, 37, 41);
      doc.text(t('pages.closing.reportUserInfo'), 14, 38);

      doc.setFontSize(9);
      doc.setTextColor(73, 80, 87);
      doc.text(`${t('pages.closing.reportName')}: ${user.name || ''}`, 14, 45);
      doc.text(`${t('pages.closing.reportLogin')}: ${user.login || ''}`, 14, 51);
      doc.text(`${t('pages.closing.reportType')}: ${translateRole(user.role, t)}`, 14, 57);

      let startY = 65;
      let lastFinalY = 0;

      if (type === 'collections' || type === 'both') {
        const collectionsTotal = todayDebits.reduce((sum: number, d: Debit) => sum + d.value, 0);

        if (todayDebits.length === 0) {
          doc.setFontSize(10);
          doc.setTextColor(108, 117, 125);
          doc.text(t('pages.closing.reportNoCollections'), 14, startY + 5);
          lastFinalY = startY + 10;
        } else {
          const tableRows = todayDebits.map((d: Debit) => [
            d.clientName,
            formatCurrencyWithSymbol(d.value),
            new Date(d.createdAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          ]);

          autoTable(doc, {
            startY,
            head: [[
              t('pages.closing.reportClient'),
              t('pages.closing.reportValue'),
              t('pages.closing.reportDateTime')
            ]],
            body: tableRows,
            foot: [[
              t('pages.closing.reportTotal'),
              formatCurrencyWithSymbol(collectionsTotal),
              ''
            ]],
            theme: 'grid',
            headStyles: {
              fillColor: [0, 123, 255],
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 9
            },
            footStyles: {
              fillColor: [248, 249, 250],
              textColor: [33, 37, 41],
              fontStyle: 'bold',
              fontSize: 9
            },
            bodyStyles: {
              fontSize: 8
            },
            columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 40, halign: 'right' },
              2: { cellWidth: 45, halign: 'center' }
            },
            margin: { left: 14, right: 14 }
          });

          lastFinalY = (doc as any).lastAutoTable?.finalY || startY;
        }
      }

      if (type === 'expenses' || type === 'both') {
        const expensesTotal = todayExpenses.reduce((sum: number, e: Expense) => sum + e.value, 0);
        startY = lastFinalY > 0 ? lastFinalY + 15 : startY;

        if (todayExpenses.length === 0) {
          doc.setFontSize(10);
          doc.setTextColor(108, 117, 125);
          doc.text(t('pages.closing.reportNoExpenses'), 14, startY + 5);
          lastFinalY = startY + 10;
        } else {
          const tableRows = todayExpenses.map((e: Expense) => [
            e.expenseTypeName,
            e.description || '-',
            formatCurrencyWithSymbol(e.value),
            new Date(e.createdAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          ]);

          autoTable(doc, {
            startY,
            head: [[
              t('pages.closing.reportExpenseType'),
              t('pages.closing.reportDescription'),
              t('pages.closing.reportValue'),
              t('pages.closing.reportDateTime')
            ]],
            body: tableRows,
            foot: [[
              t('pages.closing.reportTotalExpenses'),
              '',
              formatCurrencyWithSymbol(expensesTotal),
              ''
            ]],
            theme: 'grid',
            headStyles: {
              fillColor: [220, 53, 69],
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 9
            },
            footStyles: {
              fillColor: [248, 249, 250],
              textColor: [33, 37, 41],
              fontStyle: 'bold',
              fontSize: 9
            },
            bodyStyles: {
              fontSize: 8
            },
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 'auto' },
              2: { cellWidth: 35, halign: 'right' },
              3: { cellWidth: 40, halign: 'center' }
            },
            margin: { left: 14, right: 14 }
          });

          lastFinalY = (doc as any).lastAutoTable?.finalY || startY;
        }

        if (type === 'both') {
          const debitsTotal = todayDebits.reduce((sum: number, d: Debit) => sum + d.value, 0);
          const netBalance = debitsTotal - expensesTotal;
          const balanceLabel = netBalance >= 0 ? t('pages.closing.reportPositive') : t('pages.closing.reportNegative');

          startY = lastFinalY + 15;

          autoTable(doc, {
            startY,
            head: [[
              t('pages.closing.reportNetBalance'),
              formatCurrencyWithSymbol(Math.abs(netBalance)),
              balanceLabel
            ]],
            headStyles: {
              fillColor: netBalance >= 0 ? [40, 167, 69] : [220, 53, 69],
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 10
            },
            body: [],
            theme: 'grid',
            margin: { left: 14, right: 14 }
          });

          lastFinalY = (doc as any).lastAutoTable?.finalY || startY;
        }
      }

      const footerY = lastFinalY > 0 ? lastFinalY + 15 : 80;

      doc.setFontSize(7);
      doc.setTextColor(108, 117, 125);
      doc.text(t('pages.closing.reportFooter'), pageWidth / 2, footerY, { align: 'center' });

      const suffix = type === 'collections' ? 'cobrancas' : type === 'expenses' ? 'gastos' : 'balanco';
      const fileName = `relatorio-${suffix}-${user.login}-${now.toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      showToast(t('pages.closing.reportGenerationError'), 'danger');
    } finally {
      setIsGeneratingReport(false);
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

              {/* Botão Baixar Relatório */}
              <IonButton
                expand="block"
                shape="round"
                color="primary"
                onClick={handleDownloadReport}
                disabled={isGeneratingReport}
                style={{ marginTop: '24px' }}
              >
                {isGeneratingReport ? (
                  <IonSpinner name="dots" slot="start" />
                ) : (
                  <IonIcon icon={downloadOutline} slot="start" />
                )}
                {isGeneratingReport ? t('pages.closing.generatingReport') : t('pages.closing.downloadReport')}
              </IonButton>

              {/* Botão Fechar Dia */}
              <IonButton
                expand="block"
                shape="round"
                color="danger"
                onClick={handleFecharDia}
                style={{ marginTop: '12px' }}
              >
                <IonIcon icon={lockClosed} slot="start" />
                {t('pages.closing.closeDay')}
              </IonButton>
            </>
          )}
        </div>

        {/* Alert de Seleção de Tipo de Relatório */}
        <IonAlert
          isOpen={showReportTypeAlert}
          onDidDismiss={() => setShowReportTypeAlert(false)}
          header={t('pages.closing.reportTypeTitle')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('pages.closing.reportTypeCollections'),
              handler: () => generateReport('collections')
            },
            {
              text: t('pages.closing.reportTypeExpenses'),
              handler: () => generateReport('expenses')
            },
            {
              text: t('pages.closing.reportTypeBoth'),
              handler: () => generateReport('both')
            }
          ]}
        />

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
