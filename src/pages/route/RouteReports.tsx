import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonAlert,
} from '@ionic/react';
import { addCircle, eye, trash, documentText, chevronDown, chevronUp } from 'ionicons/icons';
import { generateRouteDailyReport, generateRouteWeeklyReport, listRouteReports, deleteReport, Report } from '../../services/reportApi';
import Toast from '../../components/Toast';
import PdfViewerModal from '../../components/PdfViewerModal';
import GenerateDailyReportModal from './modals/GenerateDailyReportModal';
import GenerateWeeklyReportModal from './modals/GenerateWeeklyReportModal';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useTranslation } from 'react-i18next';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import { formatDateToLocalISO } from '../../utils/dateFormat';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { savePdf } from '../../utils/saveFile';

const RouteReports: React.FC = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);

  const [expandedDaily, setExpandedDaily] = useState(false);
  const [expandedWeekly, setExpandedWeekly] = useState(false);

  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);

  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [showPdfModal, setShowPdfModal] = useState(false);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (yesterday.getDay() === 0) yesterday.setDate(yesterday.getDate() - 1);
  const [dailyDate, setDailyDate] = useState<string>(formatDateToLocalISO(yesterday));
  const [useDefaultDate, setUseDefaultDate] = useState(true);

  const lastSaturday = new Date(today);
  lastSaturday.setDate(today.getDate() - (today.getDay() === 0 ? 1 : today.getDay() + 1));
  const lastMonday = new Date(lastSaturday);
  lastMonday.setDate(lastSaturday.getDate() - 5);
  const [weeklyStart, setWeeklyStart] = useState<string>(formatDateToLocalISO(lastMonday));
  const [weeklyEnd, setWeeklyEnd] = useState<string>(formatDateToLocalISO(lastSaturday));

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await listRouteReports();
      setReports(data);
    } catch (error: any) {
      showToastMsg(error.message || t('reports.errorLoading'), 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const showToastMsg = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handleGenerateWeekly = async () => {
    setIsGenerating(true);
    try {
      const { report, message } = await generateRouteWeeklyReport({
        periodStart: weeklyStart,
        periodEnd: weeklyEnd
      });
      setReports(prev => [report, ...prev]);
      setShowWeeklyModal(false);
      showToastMsg(message || t('reports.generatedSuccess'), 'success');
      setTimeout(() => handleViewPDF(report), 300);
    } catch (error: any) {
      showToastMsg(error.message || t('reports.errorGenerating'), 'danger');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDaily = async () => {
    setIsGenerating(true);
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (yesterday.getDay() === 0) yesterday.setDate(yesterday.getDate() - 1);
      const dateToUse = useDefaultDate ? formatDateToLocalISO(yesterday) : dailyDate;

      const { report, message } = await generateRouteDailyReport({ date: dateToUse });
      setReports(prev => [report, ...prev]);
      setShowDailyModal(false);
      showToastMsg(message || t('reports.generatedSuccess'), 'success');
      setTimeout(() => handleViewPDF(report), 300);
    } catch (error: any) {
      showToastMsg(error.message || t('reports.errorGenerating'), 'danger');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;
    try {
      await deleteReport(reportToDelete);
      setReports(prev => prev.filter(r => r.id !== reportToDelete));
      showToastMsg(t('reports.deletedSuccess'), 'success');
    } catch (error: any) {
      showToastMsg(error.message || t('reports.errorDeleting'), 'danger');
    } finally {
      setReportToDelete(null);
      setShowDeleteAlert(false);
    }
  };

  const buildWeeklyPdf = (report: Report): jsPDF => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setTextColor(33, 37, 41);
    doc.text(report.title, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(108, 117, 125);
    doc.text(`${t('reports.generatedAt')}: ${new Date(report.createdAt).toLocaleString()}`, pageWidth / 2, 27, { align: 'center' });

    let startY = 35;

    if (report.data.detailedDays) {
      report.data.detailedDays.forEach((day) => {
        if (startY > 250) { doc.addPage(); startY = 20; }
        doc.setFontSize(12);
        doc.setTextColor(0, 123, 255);
        doc.text(`${day.date} (${day.dayOfWeek})`, 14, startY);
        startY += 8;

        if (day.credits.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(40, 167, 69);
          doc.text(t('reports.credits'), 14, startY);
          startY += 5;
          autoTable(doc, {
            startY,
            head: [[t('reports.client'), t('reports.value')]],
            body: day.credits.map(c => [c.clientName + (c.clientShop ? ` (${c.clientShop})` : ''), formatCurrencyWithSymbol(c.value)]),
            theme: 'grid',
            headStyles: { fillColor: [40, 167, 69], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 }
          });
          startY = (doc as any).lastAutoTable?.finalY || startY;
          startY += 5;
        }

        if (day.debits.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(0, 123, 255);
          doc.text(t('reports.debits'), 14, startY);
          startY += 5;
          autoTable(doc, {
            startY,
            head: [[t('reports.client'), t('reports.value')]],
            body: day.debits.map(d => [d.clientName + (d.clientShop ? ` (${d.clientShop})` : ''), formatCurrencyWithSymbol(d.value)]),
            theme: 'grid',
            headStyles: { fillColor: [0, 123, 255], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 }
          });
          startY = (doc as any).lastAutoTable?.finalY || startY;
          startY += 5;
        }

        if (day.expenses.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(220, 53, 69);
          doc.text(t('reports.expenses'), 14, startY);
          startY += 5;
          autoTable(doc, {
            startY,
            head: [[t('reports.category'), t('reports.type'), t('reports.description'), t('reports.value')]],
            body: day.expenses.map(e => [e.category, e.type, e.description || '-', formatCurrencyWithSymbol(e.value)]),
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 }
          });
          startY = (doc as any).lastAutoTable?.finalY || startY;
          startY += 5;
        }

        if (day.transactions.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(108, 117, 125);
          doc.text(t('reports.transactions'), 14, startY);
          startY += 5;
          autoTable(doc, {
            startY,
            head: [[t('reports.type'), t('reports.description'), t('reports.value')]],
            body: day.transactions.map(tx => [tx.type === 'MANAGER_DEPOSIT' ? t('reports.deposit') : t('reports.withdrawal'), tx.description || '-', formatCurrencyWithSymbol(tx.value)]),
            theme: 'grid',
            headStyles: { fillColor: [108, 117, 125], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 }
          });
          startY = (doc as any).lastAutoTable?.finalY || startY;
          startY += 5;
        }

        // Overdue clients for this day
        if (day.overdueClients && day.overdueClients.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(220, 53, 69);
          doc.text(t('reports.overdueClients'), 14, startY);
          startY += 5;
          autoTable(doc, {
            startY,
            head: [[t('reports.client'), t('reports.expectedPayment'), t('reports.amountPaid'), t('reports.remainingDebt'), t('reports.overdue')]],
            body: day.overdueClients.map(oc => [
              oc.clientName + (oc.clientShop ? ` (${oc.clientShop})` : ''),
              formatCurrencyWithSymbol(oc.expectedPayment),
              formatCurrencyWithSymbol(oc.amountPaid),
              formatCurrencyWithSymbol(oc.remainingDebt),
              oc.overdue ? t('reports.overdue') : '-',
            ]),
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69], textColor: 255, fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 }
          });
          startY = (doc as any).lastAutoTable?.finalY || startY;
          startY += 5;
        }

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

      if (startY > 230) { doc.addPage(); startY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(40, 167, 69);
      doc.text(t('reports.weeklySummary'), 14, startY);
      startY += 10;

      const ws = report.data.weeklySummary;
      if (ws) {
        autoTable(doc, {
          startY,
          body: [
            [t('reports.totalLent'), formatCurrencyWithSymbol(ws.totalLent)],
            [t('reports.totalCollected'), formatCurrencyWithSymbol(ws.totalCollected)],
            [t('reports.totalExpenses'), formatCurrencyWithSymbol(ws.totalExpenses)],
            [t('reports.totalDeposits'), formatCurrencyWithSymbol(ws.totalDeposits)],
            [t('reports.totalWithdrawals'), formatCurrencyWithSymbol(ws.totalWithdrawals)],
            [t('reports.finalBalance'), formatCurrencyWithSymbol(ws.finalBalance)]
          ],
          theme: 'grid',
          bodyStyles: { fontSize: 10, fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 50, halign: 'right' } },
          margin: { left: 14, right: 14 }
        });
      }

      // Weekly overdue summary
      const weeklyOverdue = report.data.weeklyOverdueClients || [];
      if (weeklyOverdue.length > 0) {
        if (startY > 200) { doc.addPage(); startY = 20; }
        startY = (doc as any).lastAutoTable?.finalY || startY;
        startY += 8;
        doc.setFontSize(12);
        doc.setTextColor(220, 53, 69);
        doc.text(t('reports.overdueClients'), 14, startY);
        startY += 8;

        autoTable(doc, {
          startY,
          head: [[t('reports.client'), t('reports.creditValue'), t('reports.tax'), t('reports.remainingDebt'), t('reports.overdue')]],
          body: weeklyOverdue.map(oc => [
            oc.clientName + (oc.clientShop ? ` (${oc.clientShop})` : ''),
            formatCurrencyWithSymbol(oc.initialValue),
            `${oc.tax}%`,
            formatCurrencyWithSymbol(oc.remainingDebt),
            oc.overdue ? t('reports.overdue') : '-',
          ]),
          theme: 'grid',
          headStyles: { fillColor: [220, 53, 69], textColor: 255, fontSize: 8 },
          bodyStyles: { fontSize: 7 },
          margin: { left: 14, right: 14 }
        });
      }
    }
    return doc;
  };

  const buildDailyPdf = (report: Report): jsPDF => {
    const doc = new jsPDF();
    const data = report.data;
    const summary = data.dailyRouteSummary;
    const collections = data.collectionRows || [];
    const newCredits = data.newCreditRows || [];
    const overdueClients = data.overdueClients || [];
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setTextColor(33, 37, 41);
    doc.text(t('reports.dailyByRoute'), pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(108, 117, 125);
    doc.text(`${t('reports.route')}: ${data.routeName || '-'}`, 14, 28);
    doc.text(`${t('reports.date')}: ${report.periodStart}`, 14, 34);
    doc.text(`${t('reports.generatedAt')}: ${new Date(report.createdAt).toLocaleString()}`, 14, 40);

    let startY = 48;

    if (summary) {
      const summaryHeaders = [
        t('reports.initialCash'), t('reports.collectionExpectation'), t('reports.activeClientsCount'),
        t('reports.activeCreditsCount'), t('reports.creditsWithPaymentShort'), t('reports.creditsWithoutPaymentShort'),
        t('reports.totalCollections'), t('reports.newCreditsValueShort'), t('reports.newCreditsCountShort'),
        t('reports.totalExpensesShort'), t('reports.totalDepositsShort'), t('reports.totalWithdrawalsShort'), t('reports.finalCash')
      ];
      const summaryRows = [[
        formatCurrencyWithSymbol(summary.initialCash), formatCurrencyWithSymbol(summary.collectionExpectation),
        String(summary.activeClientsCount), String(summary.activeCreditsCount),
        String(summary.creditsWithPayment), String(summary.creditsWithoutPayment),
        formatCurrencyWithSymbol(summary.totalCollections), formatCurrencyWithSymbol(summary.newCreditsValue),
        String(summary.newCreditsCount), formatCurrencyWithSymbol(summary.totalExpenses),
        formatCurrencyWithSymbol(summary.totalDeposits), formatCurrencyWithSymbol(summary.totalWithdrawals),
        formatCurrencyWithSymbol(summary.finalCash)
      ]];
      autoTable(doc, {
        startY, head: [summaryHeaders], body: summaryRows, theme: 'grid',
        headStyles: { fillColor: [0, 123, 255], textColor: 255, fontSize: 5, cellPadding: 0.5 },
        bodyStyles: { fontSize: 6, fontStyle: 'bold', cellPadding: 0.5 },
        styles: { overflow: 'linebreak', cellWidth: 'auto' },
        margin: { left: 10, right: 10 }
      });
      startY = (doc as any).lastAutoTable?.finalY || startY;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 123, 255);
    doc.text(t('reports.collectionsTable'), 14, startY + 8);
    startY += 12;

    const colHeaders = [t('reports.clientId'), t('reports.client'), t('reports.creditStartDate'), t('reports.creditValue'), t('reports.interest'), t('reports.quantityDays'), t('reports.installmentNumber'), t('reports.debitValue'), t('reports.remainingBalance'), t('reports.time')];
    const colRows = collections.map(c => [String(c.clientId), c.clientName, c.creditStartDate, formatCurrencyWithSymbol(c.creditValue), `${c.tax}%`, String(c.quantityDays), String(c.installmentNumber), formatCurrencyWithSymbol(c.debitValue), formatCurrencyWithSymbol(c.remainingBalance), c.time]);
    const totalDebits = collections.reduce((s, c) => s + c.debitValue, 0);
    const totalRemaining = collections.reduce((s, c) => s + c.remainingBalance, 0);
    const footerRow = [t('reports.totals'), '', '', '', '', '', '', formatCurrencyWithSymbol(totalDebits), formatCurrencyWithSymbol(totalRemaining), ''];

    autoTable(doc, {
      startY, head: [colHeaders], body: [...colRows, footerRow], theme: 'grid',
      headStyles: { fillColor: [0, 123, 255], textColor: 255, fontSize: 7 },
      bodyStyles: { fontSize: 7, cellPadding: 1 },
      showHead: 'everyPage', margin: { left: 10, right: 10 },
      didParseCell: (data: any) => {
        if (data.row.index === colRows.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontSize = 8;
        }
      }
    });
    startY = (doc as any).lastAutoTable?.finalY || startY;

    doc.setFontSize(12);
    doc.setTextColor(40, 167, 69);
    doc.text(t('reports.newCreditsTable'), 14, startY + 8);
    startY += 12;

    const ncHeaders = [t('reports.clientId'), t('reports.client'), t('reports.capital'), t('reports.interest'), t('reports.balance')];
    const ncRows = newCredits.map(c => [String(c.clientId), c.clientName, formatCurrencyWithSymbol(c.capital), `${c.tax}%`, formatCurrencyWithSymbol(c.balance)]);
    const totalCapital = newCredits.reduce((s, c) => s + c.capital, 0);
    const totalBalance = newCredits.reduce((s, c) => s + c.balance, 0);
    const ncFooterRow = [t('reports.totals'), '', formatCurrencyWithSymbol(totalCapital), '', formatCurrencyWithSymbol(totalBalance)];

    autoTable(doc, {
      startY, head: [ncHeaders], body: [...ncRows, ncFooterRow], theme: 'grid',
      headStyles: { fillColor: [40, 167, 69], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 1 },
      showHead: 'everyPage', margin: { left: 10, right: 10 },
      didParseCell: (data: any) => {
        if (data.row.index === ncRows.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontSize = 9;
        }
      }
    });

    // Overdue Clients Section
    if (overdueClients.length > 0) {
      const ocStartY = (doc as any).lastAutoTable?.finalY || startY;
      doc.setFontSize(12);
      doc.setTextColor(220, 53, 69);
      doc.text(t('reports.overdueClients'), 14, ocStartY + 8);
      startY = ocStartY + 12;

      const ocHeaders = [t('reports.client'), t('reports.creditValue'), t('reports.tax'), t('reports.creditStartDate'), t('reports.expectedPayment'), t('reports.amountPaid'), t('reports.remainingDebt'), t('reports.overdue')];
      const ocRows = overdueClients.map(c => [
        c.clientName + (c.clientShop ? ` (${c.clientShop})` : ''),
        formatCurrencyWithSymbol(c.initialValue), `${c.tax}%`, c.startDate,
        formatCurrencyWithSymbol(c.expectedPayment), formatCurrencyWithSymbol(c.amountPaid),
        formatCurrencyWithSymbol(c.remainingDebt), c.overdue ? t('reports.overdue') : '-'
      ]);

      autoTable(doc, {
        startY, head: [ocHeaders], body: ocRows, theme: 'grid',
        headStyles: { fillColor: [220, 53, 69], textColor: 255, fontSize: 7 },
        bodyStyles: { fontSize: 7, cellPadding: 1 },
        margin: { left: 10, right: 10 }
      });
    }

    return doc;
  };

  const handleViewPDF = async (report: Report) => {
    try {
      if (report.reportType === 'DAILY_BY_ROUTE') {
        const doc = buildDailyPdf(report);
        setPdfDoc(doc);
        setPdfFileName(`relatorio-diario-${report.periodStart}.pdf`);
        setShowPdfModal(true);
        return;
      }
      if (report.reportType === 'WEEKLY_BY_ROUTE') {
        const doc = buildWeeklyPdf(report);
        setPdfDoc(doc);
        setPdfFileName(`relatorio-semanal-${report.periodStart}-${report.periodEnd}.pdf`);
        setShowPdfModal(true);
        return;
      }
    } catch (error: any) {
      showToastMsg('Erro ao gerar PDF', 'danger');
    }
  };

  const handleDownloadPDF = async (report: Report) => {
    try {
      let doc: jsPDF;
      let fileName: string;
      if (report.reportType === 'DAILY_BY_ROUTE') {
        doc = buildDailyPdf(report);
        fileName = `relatorio-diario-${report.periodStart}.pdf`;
      } else {
        doc = buildWeeklyPdf(report);
        fileName = `relatorio-semanal-${report.periodStart}-${report.periodEnd}.pdf`;
      }
      const savedUri = await savePdf(doc, fileName);
      if (savedUri) showToastMsg(`PDF salvo: ${savedUri}`, 'success');
    } catch (error: any) {
      showToastMsg('Erro ao salvar PDF', 'danger');
    }
  };

  const dailyReports = reports.filter(r => r.reportType === 'DAILY_BY_ROUTE');
  const weeklyReports = reports.filter(r => r.reportType === 'WEEKLY_BY_ROUTE');

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#098947', '--color': '#fff' }}>
          <IonTitle>{t('reports.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => { loadReports().then(() => e.detail.complete()); }}>
          <IonRefresherContent />
        </IonRefresher>
        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          {/* Daily Report Section */}
          <div
            onClick={() => setExpandedDaily(!expandedDaily)}
            style={{
              background: 'linear-gradient(135deg, #098947 0%, #0ab55a 100%)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(9,137,71,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IonIcon icon={documentText} style={{ fontSize: '22px', color: '#fff' }} />
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: '700' }}>
                {t('reports.dailyByRoute')}
              </span>
            </div>
            <IonIcon
              icon={expandedDaily ? chevronUp : chevronDown}
              style={{ fontSize: '20px', color: '#fff' }}
            />
          </div>

          {expandedDaily && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              borderLeft: '4px solid #098947',
            }}>
              <div style={{ padding: '16px 20px' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <IonSpinner name="dots" />
                    <p style={{ fontSize: '12px', color: '#666' }}>{t('reports.loading')}</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {dailyReports.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonIcon icon={documentText} style={{ fontSize: '32px', color: '#ccc' }} />
                        <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
                          {t('reports.noReports')}
                        </p>
                      </div>
                    ) : (
                      dailyReports.map(report => (
                        <div
                          key={report.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 0',
                            borderBottom: '1px solid #f0f0f0',
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
                            <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px 0' }}>
                              {report.periodStart}
                            </p>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: '12px',
                              backgroundColor: '#e8f5e9',
                              color: '#098947',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              {t('reports.finalCash')}: {formatCurrencyWithSymbol(report.data.dailyRouteSummary?.finalCash ?? 0)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="primary"
                              onClick={() => handleViewPDF(report)}
                              style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                            >
                              <IonIcon icon={eye} style={{ fontSize: '18px' }} />
                            </IonButton>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="danger"
                              onClick={() => { setReportToDelete(report.id); setShowDeleteAlert(true); }}
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

                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                  <PrimaryButton
                    onClick={() => setShowDailyModal(true)}
                    label={t('reports.generateNew')}
                    icon={addCircle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Weekly Report Section */}
          <div
            onClick={() => setExpandedWeekly(!expandedWeekly)}
            style={{
              background: 'linear-gradient(135deg, #098947 0%, #0ab55a 100%)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(9,137,71,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IonIcon icon={documentText} style={{ fontSize: '22px', color: '#fff' }} />
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: '700' }}>
                {t('reports.weeklyByRoute')}
              </span>
            </div>
            <IonIcon
              icon={expandedWeekly ? chevronUp : chevronDown}
              style={{ fontSize: '20px', color: '#fff' }}
            />
          </div>

          {expandedWeekly && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              marginBottom: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              borderLeft: '4px solid #098947',
            }}>
              <div style={{ padding: '16px 20px' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <IonSpinner name="dots" />
                    <p style={{ fontSize: '12px', color: '#666' }}>{t('reports.loading')}</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {weeklyReports.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonIcon icon={documentText} style={{ fontSize: '32px', color: '#ccc' }} />
                        <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
                          {t('reports.noReports')}
                        </p>
                      </div>
                    ) : (
                      weeklyReports.map(report => (
                        <div
                          key={report.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 0',
                            borderBottom: '1px solid #f0f0f0',
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
                            <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px 0' }}>
                              {report.periodStart} → {report.periodEnd}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 10px',
                                borderRadius: '12px',
                                backgroundColor: (report.data.weeklySummary?.finalBalance ?? 0) >= 0 ? '#e8f5e9' : '#ffebee',
                                color: (report.data.weeklySummary?.finalBalance ?? 0) >= 0 ? '#098947' : '#d32f2f',
                                fontSize: '11px',
                                fontWeight: 600
                              }}>
                                {(report.data.weeklySummary?.finalBalance ?? 0) >= 0 ? '+' : ''}
                                {formatCurrencyWithSymbol(report.data.weeklySummary?.finalBalance ?? 0)}
                              </span>
                              <span style={{ fontSize: '11px', color: '#666' }}>
                                {(report.data.detailedDays?.length || 0)} {t('reports.days')}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="primary"
                              onClick={() => handleViewPDF(report)}
                              style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                            >
                              <IonIcon icon={eye} style={{ fontSize: '18px' }} />
                            </IonButton>
                            <IonButton
                              fill="clear"
                              size="small"
                              color="danger"
                              onClick={() => { setReportToDelete(report.id); setShowDeleteAlert(true); }}
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

                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                  <PrimaryButton
                    onClick={() => setShowWeeklyModal(true)}
                    label={t('reports.generateNew')}
                    icon={addCircle}
                  />
                </div>
              </div>
            </div>
          )}

          <Toast
            isOpen={toast.isOpen}
            message={toast.message}
            color={toast.color}
            onDidDismiss={() => setToast({ ...toast, isOpen: false })}
          />

          <IonAlert
            isOpen={showDeleteAlert}
            onDidDismiss={() => setShowDeleteAlert(false)}
            header={t('reports.confirmDelete')}
            message={t('reports.confirmDeleteMessage')}
            buttons={[
              { text: t('common.cancel'), role: 'cancel' },
              { text: t('common.delete'), handler: handleDelete }
            ]}
          />

          <PdfViewerModal
            isOpen={showPdfModal}
            onClose={() => setShowPdfModal(false)}
            doc={pdfDoc}
            fileName={pdfFileName}
            title={t('reports.title')}
          />

          <GenerateDailyReportModal
            isOpen={showDailyModal}
            onClose={() => setShowDailyModal(false)}
            dailyDate={dailyDate}
            onDailyDateChange={setDailyDate}
            useDefaultDate={useDefaultDate}
            onUseDefaultDateChange={setUseDefaultDate}
            isGenerating={isGenerating}
            onGenerate={handleGenerateDaily}
          />

          <GenerateWeeklyReportModal
            isOpen={showWeeklyModal}
            onClose={() => setShowWeeklyModal(false)}
            weeklyStart={weeklyStart}
            weeklyEnd={weeklyEnd}
            onWeeklyStartChange={setWeeklyStart}
            onWeeklyEndChange={setWeeklyEnd}
            isGenerating={isGenerating}
            onGenerate={handleGenerateWeekly}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RouteReports;
