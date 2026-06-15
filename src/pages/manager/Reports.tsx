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
  IonModal,
  IonButtons,
  IonIcon,
  IonSpinner,
  IonList,
  IonBadge,
  IonCheckbox,
  IonRefresher,
  IonRefresherContent,
  IonAlert
} from '@ionic/react';
import { close, add, download, trash, document, calendar, chevronDown, chevronUp } from 'ionicons/icons';
import { getRoutes } from '../../services/routeApi';
import { getCurrentUser } from '../../services/api';
import { generateReport, generateWeeklyByRouteReport, listReports, deleteReport, Report } from '../../services/reportApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Route {
  id: number;
  name: string;
}

type PeriodOption = 'LAST_7_DAYS' | 'LAST_WEEK';

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [showByRouteModal, setShowByRouteModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('LAST_7_DAYS');
  const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedByRoute, setExpandedByRoute] = useState(false);

  useEffect(() => {
    loadReports();
    loadRoutes();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await listReports();
      setReports(data);
    } catch (error) {
      showToast(t('reports.errorLoading'), 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoutes = async () => {
    setIsLoadingRoutes(true);
    try {
      const response = await getRoutes();
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = response.data;
      }
      const currentUser = getCurrentUser();
      let filteredRoutes = [];
      if (Array.isArray(data)) {
        if (currentUser && currentUser.id) {
          filteredRoutes = data.filter((route: any) => route.role === 'ROUTE' && route.adminId === currentUser.id);
        } else {
          filteredRoutes = data.filter((route: any) => route.role === 'ROUTE');
        }
      }
      setRoutes(filteredRoutes);
      // Default: all routes selected
      setSelectedRoutes(filteredRoutes.map((r: any) => r.id));
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handleRouteToggle = (routeId: number) => {
    setSelectedRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  const calculatePeriod = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    if (selectedPeriod === 'LAST_7_DAYS') {
      const end = new Date(today);
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { start, end };
    } else {
      // Last week: Monday to Saturday of last week
      const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - daysSinceMonday - 7);
      const lastSaturday = new Date(lastMonday);
      lastSaturday.setDate(lastMonday.getDate() + 5);
      return { start: lastMonday, end: lastSaturday };
    }
  };

  const handleGenerateGeneral = async () => {
    if (selectedRoutes.length === 0) {
      showToast(t('reports.selectAtLeastOneRoute'), 'warning');
      return;
    }
    const { start, end } = calculatePeriod();
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setIsGenerating(true);
    try {
      const newReport = await generateReport({
        reportType: 'WEEKLY_GENERAL',
        periodStart: startStr,
        periodEnd: endStr,
        routeIds: selectedRoutes
      });
      if (!newReport) {
        showToast(t('reports.errorGenerating'), 'danger');
        return;
      }
      setReports(prev => [newReport, ...prev]);
      setShowGeneralModal(false);
      showToast(t('reports.generatedSuccess'), 'success');
      handleDownloadPDF(newReport);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      showToast(t('reports.errorGenerating'), 'danger');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateByRoute = async () => {
    if (selectedRoute === null) {
      showToast(t('reports.selectOneRoute'), 'warning');
      return;
    }
    const { start, end } = calculatePeriod();
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setIsGenerating(true);
    try {
      const newReport = await generateWeeklyByRouteReport({
        periodStart: startStr,
        periodEnd: endStr,
        routeId: selectedRoute
      });
      if (!newReport) {
        showToast(t('reports.errorGenerating'), 'danger');
        return;
      }
      setReports(prev => [newReport, ...prev]);
      setShowByRouteModal(false);
      showToast(t('reports.generatedSuccess'), 'success');
      handleDownloadPDF(newReport);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      showToast(t('reports.errorGenerating'), 'danger');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = (report: Report | null | undefined) => {
    if (!report) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.setTextColor(33, 37, 41);
    doc.text(report.title, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(108, 117, 125);
    doc.text(`${t('reports.generatedAt')}: ${new Date(report.createdAt).toLocaleString()}`, pageWidth / 2, 27, { align: 'center' });

    let startY = 35;

    if (report.reportType === 'WEEKLY_BY_ROUTE' && report.data.detailedDays) {
      // Detailed by route report
      report.data.detailedDays.forEach((day) => {
        if (startY > 250) {
          doc.addPage();
          startY = 20;
        }

        // Day header
        doc.setFontSize(12);
        doc.setTextColor(0, 123, 255);
        doc.text(`${day.date} (${day.dayOfWeek})`, 14, startY);
        startY += 8;

        // Credits
        if (day.credits.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(40, 167, 69);
          doc.text(t('reports.credits'), 14, startY);
          startY += 5;
          const creditRows = day.credits.map(c => [
            c.clientName + (c.clientShop ? ` (${c.clientShop})` : ''),
            formatCurrencyWithSymbol(c.value)
          ]);
          autoTable(doc, {
            startY,
            head: [[t('reports.client'), t('reports.value')]],
            body: creditRows,
            theme: 'grid',
            headStyles: { fillColor: [40, 167, 69], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 }
          });
          startY = (doc as any).lastAutoTable?.finalY || startY;
          startY += 5;
        }

        // Debits
        if (day.debits.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(0, 123, 255);
          doc.text(t('reports.debits'), 14, startY);
          startY += 5;
          const debitRows = day.debits.map(d => [
            d.clientName + (d.clientShop ? ` (${d.clientShop})` : ''),
            formatCurrencyWithSymbol(d.value)
          ]);
          autoTable(doc, {
            startY,
            head: [[t('reports.client'), t('reports.value')]],
            body: debitRows,
            theme: 'grid',
            headStyles: { fillColor: [0, 123, 255], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 }
          });
          startY = (doc as any).lastAutoTable?.finalY || startY;
          startY += 5;
        }

        // Expenses
        if (day.expenses.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(220, 53, 69);
          doc.text(t('reports.expenses'), 14, startY);
          startY += 5;
          const expenseRows = day.expenses.map(e => [
            e.category,
            e.type,
            e.description || '-',
            formatCurrencyWithSymbol(e.value)
          ]);
          autoTable(doc, {
            startY,
            head: [[t('reports.category'), t('reports.type'), t('reports.description'), t('reports.value')]],
            body: expenseRows,
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 }
          });
          startY = (doc as any).lastAutoTable?.finalY || startY;
          startY += 5;
        }

        // Transactions
        if (day.transactions.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(108, 117, 125);
          doc.text(t('reports.transactions'), 14, startY);
          startY += 5;
          const transRows = day.transactions.map(tx => [
            tx.type === 'MANAGER_DEPOSIT' ? t('reports.deposit') : t('reports.withdrawal'),
            tx.description || '-',
            formatCurrencyWithSymbol(tx.value)
          ]);
          autoTable(doc, {
            startY,
            head: [[t('reports.type'), t('reports.description'), t('reports.value')]],
            body: transRows,
            theme: 'grid',
            headStyles: { fillColor: [108, 117, 125], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 }
          });
          startY = (doc as any).lastAutoTable?.finalY || startY;
          startY += 5;
        }

        // Daily total
        if (day.dailyTotal) {
          doc.setFontSize(9);
          doc.setTextColor(33, 37, 41);
          doc.text(t('reports.dailyTotal') + ':', 14, startY);
          startY += 5;
          doc.text(
            `${t('reports.lent')}: ${formatCurrencyWithSymbol(day.dailyTotal.totalLent)} | ` +
            `${t('reports.collected')}: ${formatCurrencyWithSymbol(day.dailyTotal.totalCollected)} | ` +
            `${t('reports.expenses')}: ${formatCurrencyWithSymbol(day.dailyTotal.totalExpenses)} | ` +
            `${t('reports.deposits')}: ${formatCurrencyWithSymbol(day.dailyTotal.totalDeposits)} | ` +
            `${t('reports.withdrawals')}: ${formatCurrencyWithSymbol(day.dailyTotal.totalWithdrawals)} | ` +
            `${t('reports.balance')}: ${formatCurrencyWithSymbol(day.dailyTotal.balance)}`,
            14, startY
          );
          startY += 12;
        }
      });
    } else if (report.data.days) {
      // General report
      report.data.days.forEach((day) => {
        if (startY > 250) {
          doc.addPage();
          startY = 20;
        }

        // Day header
        doc.setFontSize(12);
        doc.setTextColor(0, 123, 255);
        doc.text(`${day.date} (${day.dayOfWeek})`, 14, startY);
        startY += 8;

        // Routes table
        if (day.routes.length > 0) {
          const tableRows = day.routes.map(r => [
            r.routeName,
            formatCurrencyWithSymbol(r.totalLent),
            formatCurrencyWithSymbol(r.totalCollected),
            formatCurrencyWithSymbol(r.totalExpenses),
            formatCurrencyWithSymbol(r.totalDeposits),
            formatCurrencyWithSymbol(r.totalWithdrawals),
            formatCurrencyWithSymbol(r.dailyBalance)
          ]);

          autoTable(doc, {
            startY,
            head: [[
              t('reports.route'),
              t('reports.lent'),
              t('reports.collected'),
              t('reports.expenses'),
              t('reports.deposits'),
              t('reports.withdrawals'),
              t('reports.balance')
            ]],
            body: tableRows,
            theme: 'grid',
            headStyles: {
              fillColor: [0, 123, 255],
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 8
            },
            bodyStyles: { fontSize: 7 },
            columnStyles: {
              0: { cellWidth: 30 },
              1: { cellWidth: 25, halign: 'right' },
              2: { cellWidth: 25, halign: 'right' },
              3: { cellWidth: 25, halign: 'right' },
              4: { cellWidth: 25, halign: 'right' },
              5: { cellWidth: 25, halign: 'right' },
              6: { cellWidth: 25, halign: 'right' }
            },
            margin: { left: 14, right: 14 }
          });

          startY = (doc as any).lastAutoTable?.finalY || startY;
          startY += 10;
        }

        // Daily total
        if (day.dailyTotal) {
          doc.setFontSize(9);
          doc.setTextColor(33, 37, 41);
          doc.text(t('reports.dailyTotal') + ':', 14, startY);
          startY += 5;
          doc.text(`${t('reports.lent')}: ${formatCurrencyWithSymbol(day.dailyTotal.totalLent)} | ${t('reports.collected')}: ${formatCurrencyWithSymbol(day.dailyTotal.totalCollected)} | ${t('reports.expenses')}: ${formatCurrencyWithSymbol(day.dailyTotal.totalExpenses)} | ${t('reports.balance')}: ${formatCurrencyWithSymbol(day.dailyTotal.balance)}`, 14, startY);
          startY += 12;
        }
      });
    }

    // Weekly summary
    if (startY > 230) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40, 167, 69);
    doc.text(t('reports.weeklySummary'), 14, startY);
    startY += 10;

    const ws = report.data.weeklySummary;
    const summaryRows = [
      [t('reports.totalLent'), formatCurrencyWithSymbol(ws.totalLent)],
      [t('reports.totalCollected'), formatCurrencyWithSymbol(ws.totalCollected)],
      [t('reports.totalExpenses'), formatCurrencyWithSymbol(ws.totalExpenses)],
      [t('reports.totalDeposits'), formatCurrencyWithSymbol(ws.totalDeposits)],
      [t('reports.totalWithdrawals'), formatCurrencyWithSymbol(ws.totalWithdrawals)],
      [t('reports.finalBalance'), formatCurrencyWithSymbol(ws.finalBalance)]
    ];

    autoTable(doc, {
      startY,
      body: summaryRows,
      theme: 'grid',
      bodyStyles: {
        fontSize: 10,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 50, halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    const fileName = `relatorio-${report.periodStart}-${report.periodEnd}.pdf`;
    doc.save(fileName);
  };

  const handleDelete = (id: number) => {
    setReportToDelete(id);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (reportToDelete === null) return;
    try {
      await deleteReport(reportToDelete);
      setReports(prev => prev.filter(r => r.id !== reportToDelete));
      showToast(t('reports.deletedSuccess'), 'success');
    } catch (error) {
      showToast(t('reports.errorDeleting'), 'danger');
    } finally {
      setShowDeleteAlert(false);
      setReportToDelete(null);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('reports.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={async (e) => {
          await loadReports();
          e.detail.complete();
        }}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          {/* Main Expandable Button */}
          <IonButton
            expand="block"
            color="primary"
            onClick={() => setExpanded(!expanded)}
            style={{ 
              marginBottom: expanded ? '16px' : '0', 
              height: '56px',
              borderRadius: '4px'
            }}
          >
            <IonIcon icon={document} slot="start" style={{ fontSize: '24px' }} />
            <span style={{ fontSize: '16px' }}>
              {t('reports.weeklyGeneral')}
            </span>
            <IonIcon 
              icon={expanded ? chevronUp : chevronDown} 
              slot="end" 
              style={{ fontSize: '20px' }}
            />
          </IonButton>

          {/* Expanded Content */}
          {expanded && (
            <IonCard style={{ margin: '0 0 16px 0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '12px' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <IonSpinner name="dots" />
                    <p style={{ fontSize: '12px', color: '#666' }}>{t('reports.loading')}</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {reports.filter(r => r && r.reportType === 'WEEKLY_GENERAL').length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonIcon icon={document} style={{ fontSize: '32px', color: '#ccc' }} />
                        <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
                          {t('reports.noReports')}
                        </p>
                      </div>
                    ) : (
                      reports.filter(r => r && r.reportType === 'WEEKLY_GENERAL').map(report => (
                        <div 
                          key={report.id} 
                          style={{ 
                            padding: '10px', 
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ 
                              fontSize: '14px', 
                              fontWeight: 'bold',
                              color: '#333',
                              margin: '0 0 4px 0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {report.title}
                            </p>
                            <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                              {report.periodStart} → {report.periodEnd}
                            </p>
                            <div style={{ marginTop: '4px' }}>
                              <IonBadge color={report.data.weeklySummary.finalBalance >= 0 ? 'success' : 'danger'} style={{ fontSize: '10px' }}>
                                 {report.data.weeklySummary.finalBalance >= 0 ? '+' : ''}
                                {formatCurrencyWithSymbol(report.data.weeklySummary.finalBalance)}
                              </IonBadge>
                              <span style={{ fontSize: '10px', color: '#666', marginLeft: '6px' }}>
                                {(report.data.days?.length || report.data.detailedDays?.length || 0)} {t('reports.days')}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="primary"
                              onClick={() => handleDownloadPDF(report)}
                              style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                            >
                              <IonIcon icon={download} style={{ fontSize: '18px' }} />
                            </IonButton>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="danger"
                              onClick={() => handleDelete(report.id)}
                              style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                            >
                              <IonIcon icon={trash} style={{ fontSize: '18px' }} />
                            </IonButton>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Generate New Button */}
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                  <IonButton
                    expand="block"
                    shape="round"
                    color="primary"
                    fill="outline"
                    onClick={() => setShowGeneralModal(true)}
                    style={{ height: '40px' }}
                  >
                    <IonIcon icon={add} slot="start" />
                    {t('reports.generateNew')}
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Second Expandable Button - Weekly by Route */}
          <IonButton
            expand="block"
            color="primary"
            onClick={() => setExpandedByRoute(!expandedByRoute)}
            style={{ 
              marginBottom: expandedByRoute ? '16px' : '0', 
              height: '56px',
              borderRadius: '4px'
            }}
          >
            <IonIcon icon={document} slot="start" style={{ fontSize: '24px' }} />
            <span style={{ fontSize: '16px' }}>
              {t('reports.weeklyByRoute')}
            </span>
            <IonIcon 
              icon={expandedByRoute ? chevronUp : chevronDown} 
              slot="end" 
              style={{ fontSize: '20px' }}
            />
          </IonButton>

          {/* Expanded Content for Weekly by Route */}
          {expandedByRoute && (
            <IonCard style={{ margin: '0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '12px' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <IonSpinner name="dots" />
                    <p style={{ fontSize: '12px', color: '#666' }}>{t('reports.loading')}</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {reports.filter(r => r && r.reportType === 'WEEKLY_BY_ROUTE').length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonIcon icon={document} style={{ fontSize: '32px', color: '#ccc' }} />
                        <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
                          {t('reports.noReports')}
                        </p>
                      </div>
                    ) : (
                      reports.filter(r => r && r.reportType === 'WEEKLY_BY_ROUTE').map(report => (
                        <div 
                          key={report.id} 
                          style={{ 
                            padding: '10px', 
                            borderBottom: '1px solid #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ 
                              fontSize: '14px', 
                              fontWeight: 'bold',
                              color: '#333',
                              margin: '0 0 4px 0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {report.title}
                            </p>
                            <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                              {report.periodStart} → {report.periodEnd}
                            </p>
                            <div style={{ marginTop: '4px' }}>
                              <IonBadge color={report.data.weeklySummary.finalBalance >= 0 ? 'success' : 'danger'} style={{ fontSize: '10px' }}>
                                 {report.data.weeklySummary.finalBalance >= 0 ? '+' : ''}
                                {formatCurrencyWithSymbol(report.data.weeklySummary.finalBalance)}
                              </IonBadge>
                              <span style={{ fontSize: '10px', color: '#666', marginLeft: '6px' }}>
                                {(report.data.days?.length || report.data.detailedDays?.length || 0)} {t('reports.days')}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="primary"
                              onClick={() => handleDownloadPDF(report)}
                              style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                            >
                              <IonIcon icon={download} style={{ fontSize: '18px' }} />
                            </IonButton>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="danger"
                              onClick={() => handleDelete(report.id)}
                              style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                            >
                              <IonIcon icon={trash} style={{ fontSize: '18px' }} />
                            </IonButton>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Generate New Button */}
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                    <IonButton
                    expand="block"
                    shape="round"
                    color="primary"
                    fill="outline"
                    onClick={() => setShowByRouteModal(true)}
                    style={{ height: '40px' }}
                  >
                    <IonIcon icon={add} slot="start" />
                    {t('reports.generateNew')}
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        {/* Generate General Modal */}
        <IonModal isOpen={showGeneralModal} onDidDismiss={() => setShowGeneralModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('reports.generateWeeklyReport')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowGeneralModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              {/* Period Selection */}
              <IonCard style={{ marginBottom: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '16px' }}>
                    <IonIcon icon={calendar} style={{ marginRight: '8px' }} />
                    {t('reports.selectPeriod')}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonLabel>{t('reports.last7Days')}</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={selectedPeriod === 'LAST_7_DAYS'}
                      onIonChange={() => setSelectedPeriod('LAST_7_DAYS')}
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel>{t('reports.lastWeek')}</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={selectedPeriod === 'LAST_WEEK'}
                      onIonChange={() => setSelectedPeriod('LAST_WEEK')}
                    />
                  </IonItem>
                </IonCardContent>
              </IonCard>

              {/* Routes Selection */}
              <IonCard style={{ marginBottom: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '16px' }}>
                    {t('reports.selectRoutes')}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {isLoadingRoutes ? (
                    <div style={{ textAlign: 'center' }}>
                      <IonSpinner name="dots" />
                    </div>
                  ) : routes.length === 0 ? (
                    <p>{t('reports.noRoutes')}</p>
                  ) : (
                    <>
                      <IonItem>
                        <IonLabel>{t('reports.allRoutes')}</IonLabel>
                        <IonCheckbox
                          slot="end"
                          checked={selectedRoutes.length === routes.length}
                          onIonChange={() => {
                            if (selectedRoutes.length === routes.length) {
                              setSelectedRoutes([]);
                            } else {
                              setSelectedRoutes(routes.map(r => r.id));
                            }
                          }}
                        />
                      </IonItem>
                      {routes.map(route => (
                        <IonItem key={route.id}>
                          <IonLabel>{route.name}</IonLabel>
                          <IonCheckbox
                            slot="end"
                            checked={selectedRoutes.includes(route.id)}
                            onIonChange={() => handleRouteToggle(route.id)}
                          />
                        </IonItem>
                      ))}
                    </>
                  )}
                </IonCardContent>
              </IonCard>

              {/* Generate Button */}
              <IonButton
                expand="block"
                shape="round"
                color="primary"
                onClick={handleGenerateGeneral}
                disabled={isGenerating || selectedRoutes.length === 0}
              >
                {isGenerating ? (
                  <IonSpinner name="dots" slot="start" />
                ) : (
                  <IonIcon icon={add} slot="start" />
                )}
                {isGenerating ? t('reports.generating') : t('reports.generate')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Generate By Route Modal */}
        <IonModal isOpen={showByRouteModal} onDidDismiss={() => setShowByRouteModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('reports.weeklyByRoute')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowByRouteModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              {/* Period Selection */}
              <IonCard style={{ marginBottom: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '16px' }}>
                    <IonIcon icon={calendar} style={{ marginRight: '8px' }} />
                    {t('reports.selectPeriod')}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonLabel>{t('reports.last7Days')}</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={selectedPeriod === 'LAST_7_DAYS'}
                      onIonChange={() => setSelectedPeriod('LAST_7_DAYS')}
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel>{t('reports.lastWeek')}</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={selectedPeriod === 'LAST_WEEK'}
                      onIonChange={() => setSelectedPeriod('LAST_WEEK')}
                    />
                  </IonItem>
                </IonCardContent>
              </IonCard>

              {/* Single Route Selection */}
              <IonCard style={{ marginBottom: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '16px' }}>
                    {t('reports.selectOneRoute')}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {isLoadingRoutes ? (
                    <div style={{ textAlign: 'center' }}>
                      <IonSpinner name="dots" />
                    </div>
                  ) : routes.length === 0 ? (
                    <p>{t('reports.noRoutes')}</p>
                  ) : (
                    routes.map(route => (
                      <IonItem key={route.id}>
                        <IonLabel>{route.name}</IonLabel>
                        <IonCheckbox
                          slot="end"
                          checked={selectedRoute === route.id}
                          onIonChange={() => setSelectedRoute(route.id)}
                        />
                      </IonItem>
                    ))
                  )}
                </IonCardContent>
              </IonCard>

              {/* Generate Button */}
              <IonButton
                expand="block"
                shape="round"
                color="primary"
                onClick={handleGenerateByRoute}
                disabled={isGenerating || selectedRoute === null}
              >
                {isGenerating ? (
                  <IonSpinner name="dots" slot="start" />
                ) : (
                  <IonIcon icon={add} slot="start" />
                )}
                {isGenerating ? t('reports.generating') : t('reports.generate')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Delete Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={t('reports.confirmDelete')}
          message={t('reports.confirmDeleteMessage')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('common.delete'),
              role: 'destructive',
              handler: confirmDelete
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
};

export default Reports;
