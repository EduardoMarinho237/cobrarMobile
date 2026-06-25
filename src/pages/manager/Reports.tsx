import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonItem,
  IonLabel,
  IonModal,
  IonIcon,
  IonSpinner,
  IonBadge,
  IonCheckbox,
  IonRefresher,
  IonRefresherContent,
  IonAlert,
  IonInput
} from '@ionic/react';
import { close, addCircle, trash, document, calendar, chevronDown, chevronUp, eye, documentText } from 'ionicons/icons';
import GreenHeader from '../../components/ui/GreenHeader';
import PrimaryButton from '../../components/ui/PrimaryButton';
import ModernCard from '../../components/ui/ModernCard';
import { getRoutes } from '../../services/routeApi';
import { getCurrentUser } from '../../services/api';
import { generateReport, generateWeeklyByRouteReport, generateSimpleWeeklyReport, generateDailyByRouteReport, listReports, deleteReport, Report } from '../../services/reportApi';
import Toast from '../../components/Toast';
import PdfViewerModal from '../../components/PdfViewerModal';
import { useTranslation } from 'react-i18next';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import { formatDateToLocalISO } from '../../utils/dateFormat';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { savePdf } from '../../utils/saveFile';

interface Route {
  id: number;
  name: string;
}

type PeriodOption = 'LAST_WEEK';

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
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('LAST_WEEK');
  const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedByRoute, setExpandedByRoute] = useState(false);
  const [showSimpleWeeklyModal, setShowSimpleWeeklyModal] = useState(false);
  const [expandedSimpleWeekly, setExpandedSimpleWeekly] = useState(false);
  const [showDailyByRouteModal, setShowDailyByRouteModal] = useState(false);
  const [expandedDailyByRoute, setExpandedDailyByRoute] = useState(false);
  const [useDefaultDate, setUseDefaultDate] = useState(true);
  const [selectedRouteDaily, setSelectedRouteDaily] = useState<number | null>(null);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // PDF Viewer state
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [showPdfModal, setShowPdfModal] = useState(false);

  const getYesterday = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (yesterday.getDay() === 0) {
      yesterday.setDate(yesterday.getDate() - 1);
    }
    return formatDateToLocalISO(yesterday);
  };
  const [selectedDate, setSelectedDate] = useState<string>(getYesterday());

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
    if (useCustomDates && customStartDate && customEndDate) {
      return { start: new Date(customStartDate + 'T00:00:00'), end: new Date(customEndDate + 'T00:00:00') };
    }

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    // Last week: Monday to Saturday of last week
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysSinceMonday - 7);
    const lastSaturday = new Date(lastMonday);
    lastSaturday.setDate(lastMonday.getDate() + 5);
    return { start: lastMonday, end: lastSaturday };
  };

  const handleGenerateGeneral = async () => {
    if (selectedRoutes.length === 0) {
      showToast(t('reports.selectAtLeastOneRoute'), 'warning');
      return;
    }
    const { start, end } = calculatePeriod();
    const startStr = formatDateToLocalISO(start);
    const endStr = formatDateToLocalISO(end);

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
      handleViewPDF(newReport);
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      showToast(error?.message || t('reports.errorGenerating'), 'danger');
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
    const startStr = formatDateToLocalISO(start);
    const endStr = formatDateToLocalISO(end);

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
      handleViewPDF(newReport);
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      showToast(error?.message || t('reports.errorGenerating'), 'danger');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSimpleWeekly = async () => {
    if (selectedRoutes.length === 0) {
      showToast(t('reports.selectAtLeastOneRoute'), 'warning');
      return;
    }
    const { start, end } = calculatePeriod();
    const startStr = formatDateToLocalISO(start);
    const endStr = formatDateToLocalISO(end);

    setIsGenerating(true);
    try {
      const newReport = await generateSimpleWeeklyReport({
        periodStart: startStr,
        periodEnd: endStr,
        routeIds: selectedRoutes
      });
      if (!newReport) {
        showToast(t('reports.errorGenerating'), 'danger');
        return;
      }
      setReports(prev => [newReport, ...prev]);
      setShowSimpleWeeklyModal(false);
      showToast(t('reports.generatedSuccess'), 'success');
      handleViewPDF(newReport);
    } catch (error: any) {
      console.error('Erro ao gerar relatório simplificado:', error);
      showToast(error?.message || t('reports.errorGenerating'), 'danger');
    } finally {
      setIsGenerating(false);
    }
  };

  const validateDailyReport = (dateStr: string, routeId: number): string | null => {
    const date = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0) {
      return t('reports.errorSunday');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date.getTime() >= today.getTime()) {
      return t('reports.errorFuture');
    }

    const route = routes.find(r => r.id === routeId);

    return null;
  };

  const handleGenerateDailyByRoute = async () => {
    if (selectedRouteDaily === null) {
      showToast(t('reports.selectOneRoute'), 'warning');
      return;
    }
    const dateStr = useDefaultDate ? getYesterday() : selectedDate;

    const validationError = validateDailyReport(dateStr, selectedRouteDaily);
    if (validationError) {
      showToast(validationError, 'danger');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateDailyByRouteReport({
        date: dateStr,
        routeId: selectedRouteDaily
      });
      if (!result?.report) {
        showToast(result?.message || t('reports.errorGenerating'), 'danger');
        return;
      }
      setReports(prev => [result.report, ...prev]);
      setShowDailyByRouteModal(false);
      showToast(result.message || t('reports.generatedSuccess'), 'success');
      handleViewPDF(result.report);
    } catch (error: any) {
      console.error('Erro ao gerar relatório diário:', error);
      showToast(error?.message || t('reports.errorGenerating'), 'danger');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDailyRoutePDF = (doc: jsPDF, report: Report) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const data = report.data;
    const summary = data.dailyRouteSummary;
    const collections = data.collectionRows || [];
    const newCredits = data.newCreditRows || [];
    const overdueClients = data.overdueClients || [];

    // ── Header ──
    doc.setFontSize(16);
    doc.setTextColor(33, 37, 41);
    doc.text(t('reports.dailyByRoute'), pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(108, 117, 125);
    doc.text(`${t('reports.route')}: ${data.routeName || '-'}`, 14, 28);
    doc.text(`${t('reports.date')}: ${report.periodStart}`, 14, 34);
    doc.text(`${t('reports.generatedAt')}: ${new Date(report.createdAt).toLocaleString()}`, 14, 40);

    let startY = 48;

    // ── Table 1: Daily Summary ──
    if (summary) {
      const summaryHeaders = [
        t('reports.initialCash'),
        t('reports.collectionExpectation'),
        t('reports.activeClientsCount'),
        t('reports.activeCreditsCount'),
        t('reports.creditsWithPaymentShort'),
        t('reports.creditsWithoutPaymentShort'),
        t('reports.totalCollections'),
        t('reports.newCreditsValueShort'),
        t('reports.newCreditsCountShort'),
        t('reports.totalExpensesShort'),
        t('reports.totalDepositsShort'),
        t('reports.totalWithdrawalsShort'),
        t('reports.finalCash')
      ];
      const summaryRows = [[
        formatCurrencyWithSymbol(summary.initialCash),
        formatCurrencyWithSymbol(summary.collectionExpectation),
        String(summary.activeClientsCount),
        String(summary.activeCreditsCount),
        String(summary.creditsWithPayment),
        String(summary.creditsWithoutPayment),
        formatCurrencyWithSymbol(summary.totalCollections),
        formatCurrencyWithSymbol(summary.newCreditsValue),
        String(summary.newCreditsCount),
        formatCurrencyWithSymbol(summary.totalExpenses),
        formatCurrencyWithSymbol(summary.totalDeposits),
        formatCurrencyWithSymbol(summary.totalWithdrawals),
        formatCurrencyWithSymbol(summary.finalCash)
      ]];

      autoTable(doc, {
        startY,
        head: [summaryHeaders],
        body: summaryRows,
        theme: 'grid',
        headStyles: { fillColor: [0, 123, 255], textColor: 255, fontSize: 5, cellPadding: 0.5 },
        bodyStyles: { fontSize: 6, fontStyle: 'bold', cellPadding: 0.5 },
        styles: { overflow: 'linebreak', cellWidth: 'auto' },
        margin: { left: 10, right: 10 }
      });
      startY = (doc as any).lastAutoTable?.finalY || startY;
    }

    // ── Table 2: Collections ──
    doc.setFontSize(12);
    doc.setTextColor(0, 123, 255);
    doc.text(t('reports.collectionsTable'), 14, startY + 8);
    startY += 12;

    const colHeaders = [
      t('reports.clientId'),
      t('reports.client'),
      t('reports.creditStartDate'),
      t('reports.creditValue'),
      t('reports.interest'),
      t('reports.quantityDays'),
      t('reports.installmentNumber'),
      t('reports.debitValue'),
      t('reports.remainingBalance'),
      t('reports.time')
    ];

    const colRows = collections.map(c => [
      String(c.clientId),
      c.clientName,
      c.creditStartDate,
      formatCurrencyWithSymbol(c.creditValue),
      `${c.tax}%`,
      String(c.quantityDays),
      String(c.installmentNumber),
      formatCurrencyWithSymbol(c.debitValue),
      formatCurrencyWithSymbol(c.remainingBalance),
      c.time
    ]);

    // body rows + totals footer row merged into a single table
    const totalDebits = collections.reduce((s, c) => s + c.debitValue, 0);
    const totalRemaining = collections.reduce((s, c) => s + c.remainingBalance, 0);
    const footerRow = [
      t('reports.totals'), '', '', '', '', '', '',
      formatCurrencyWithSymbol(totalDebits),
      formatCurrencyWithSymbol(totalRemaining),
      ''
    ];

    autoTable(doc, {
      startY,
      head: [colHeaders],
      body: [...colRows, footerRow],
      theme: 'grid',
      headStyles: { fillColor: [0, 123, 255], textColor: 255, fontSize: 7 },
      bodyStyles: { fontSize: 7, cellPadding: 1 },
      showHead: 'everyPage',
      margin: { left: 10, right: 10 },
      didParseCell: (data: any) => {
        if (data.row.index === colRows.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.fontSize = 8;
        }
      }
    });
    startY = (doc as any).lastAutoTable?.finalY || startY;

    // ── Table 3: New Credits ──
    doc.setFontSize(12);
    doc.setTextColor(40, 167, 69);
    doc.text(t('reports.newCreditsTable'), 14, startY + 8);
    startY += 12;

    const ncHeaders = [
      t('reports.clientId'),
      t('reports.client'),
      t('reports.capital'),
      t('reports.interest'),
      t('reports.balance')
    ];

    const ncRows = newCredits.map(c => [
      String(c.clientId),
      c.clientName,
      formatCurrencyWithSymbol(c.capital),
      `${c.tax}%`,
      formatCurrencyWithSymbol(c.balance)
    ]);

    const totalCapital = newCredits.reduce((s, c) => s + c.capital, 0);
    const totalBalance = newCredits.reduce((s, c) => s + c.balance, 0);
    const ncFooterRow = [
      t('reports.totals'), '',
      formatCurrencyWithSymbol(totalCapital), '',
      formatCurrencyWithSymbol(totalBalance)
    ];

    autoTable(doc, {
      startY,
      head: [ncHeaders],
      body: [...ncRows, ncFooterRow],
      theme: 'grid',
      headStyles: { fillColor: [40, 167, 69], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 1 },
      showHead: 'everyPage',
      margin: { left: 10, right: 10 },
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
        c.clientName,
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
  };

  const handleViewPDF = async (report: Report | null | undefined) => {
    if (!report) return;
    try {
      if (report.reportType === 'DAILY_BY_ROUTE' && report.data.dailyRouteSummary) {
        const doc = new jsPDF();
        generateDailyRoutePDF(doc, report);
        setPdfDoc(doc);
        setPdfFileName(`relatorio-diario-${report.periodStart}-${report.data.routeName}.pdf`);
        setShowPdfModal(true);
        return;
      }

      if (report.reportType === 'SIMPLE_WEEKLY' && report.data.simpleDays) {
        const doc = new jsPDF('l', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const simpleDays = report.data.simpleDays;
        const summary = report.data.simpleSummary!;

        doc.setFontSize(16);
        doc.setTextColor(33, 37, 41);
        doc.text(report.title, pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(108, 117, 125);
        doc.text(`${t('reports.generatedAt')}: ${new Date(report.createdAt).toLocaleString()}`, pageWidth / 2, 22, { align: 'center' });

        let startY = 30;

        if (report.data.includedRoutes && report.data.includedRoutes.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(33, 37, 41);
          doc.text(t('reports.route') + 's: ' + report.data.includedRoutes.join(', '), 14, startY);
          startY += 7;
        }

        const dayHeaders = [
          t('reports.dayOfWeek'),
          t('reports.date'),
          t('reports.newCredits'),
          t('reports.paymentsValue'),
          t('reports.collectedClients'),
          t('reports.activeCredits'),
          t('reports.creditsWithPayment'),
          t('reports.creditsWithoutPayment'),
          t('reports.expenses'),
          t('reports.deposits'),
          t('reports.withdrawals'),
          t('reports.cashAdjustment'),
          t('reports.cashBalance')
        ];
        const dayRows = simpleDays.map(d => [
          d.dayOfWeek.substring(0, 3),
          d.date,
          `${formatCurrencyWithSymbol(d.newCreditsValue)} (${d.newCreditsCount})`,
          `${formatCurrencyWithSymbol(d.paymentsValue)} (${d.paymentsCount})`,
          String(d.collectedClientsCount ?? 0),
          String(d.activeCreditsCount),
          String(d.creditsWithPayment),
          String(d.creditsWithoutPayment),
          formatCurrencyWithSymbol(d.totalExpenses),
          formatCurrencyWithSymbol(d.deposits),
          formatCurrencyWithSymbol(d.withdrawals),
          formatCurrencyWithSymbol(d.cashAdjustment),
          formatCurrencyWithSymbol(d.cashBalance)
        ]);

        autoTable(doc, {
          startY,
          head: [dayHeaders],
          body: dayRows,
          theme: 'grid',
          headStyles: {
            fillColor: [0, 123, 255],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 7
          },
          bodyStyles: { fontSize: 9, fontStyle: 'bold', cellPadding: 1 },
          columnStyles: {
            0: { cellWidth: 11, halign: 'left' },
            1: { cellWidth: 19, halign: 'center' },
            2: { cellWidth: 32, halign: 'right' },
            3: { cellWidth: 32, halign: 'right' },
            4: { cellWidth: 16, halign: 'center' },
            5: { cellWidth: 16, halign: 'center' },
            6: { cellWidth: 15, halign: 'center' },
            7: { cellWidth: 15, halign: 'center' },
            8: { cellWidth: 29, halign: 'right' },
            9: { cellWidth: 29, halign: 'right' },
            10: { cellWidth: 27, halign: 'right' },
            11: { cellWidth: 23, halign: 'right' },
            12: { cellWidth: 25, halign: 'right' }
          },
          margin: { left: 4, right: 4 }
        });

        startY = (doc as any).lastAutoTable?.finalY || startY;
        startY += 4;

        const totalDays = summary.totalDays || simpleDays.length;
        const totalNewCreditsValue = simpleDays.reduce((s, d) => s + d.newCreditsValue, 0);
        const totalExpenses = simpleDays.reduce((s, d) => s + d.totalExpenses, 0);
        const totalDeposits = simpleDays.reduce((s, d) => s + d.deposits, 0);
        const totalWithdrawals = simpleDays.reduce((s, d) => s + d.withdrawals, 0);

        const calcAvg = (fn: (d: typeof simpleDays[0]) => number) =>
          totalDays > 0 ? Math.round((simpleDays.reduce((s, d) => s + fn(d), 0) / totalDays) * 100) / 100 : 0;

        const avgCollectedClients = calcAvg(d => d.collectedClientsCount ?? 0);
        const avgActiveCredits = calcAvg(d => d.activeCreditsCount);
        const avgWithPayment = calcAvg(d => d.creditsWithPayment);
        const avgWithoutPayment = calcAvg(d => d.creditsWithoutPayment);
        const avgExpenses = calcAvg(d => d.totalExpenses);
        const avgDeposits = calcAvg(d => d.deposits);
        const avgWithdrawals = calcAvg(d => d.withdrawals);
        const avgCashBalance = calcAvg(d => d.cashBalance);

        doc.setFontSize(11);
        doc.setTextColor(40, 167, 69);
        doc.text(t('reports.summaryTitle'), 4, startY);
        startY += 4;

        const summaryRows = [
          [t('reports.totalNewCreditsValue'), formatCurrencyWithSymbol(totalNewCreditsValue)],
          [t('reports.totalPaymentsValue'), formatCurrencyWithSymbol(summary.totalPaymentsValue)],
          [t('reports.averagePaymentsPerDay'), String(summary.averagePaymentsPerDay)],
          [t('reports.avgCollectedClientsPerDay'), String(avgCollectedClients)],
          [t('reports.avgActiveCredits'), String(avgActiveCredits)],
          [t('reports.avgWithPayment'), String(avgWithPayment)],
          [t('reports.avgWithoutPayment'), String(avgWithoutPayment)],
          [t('reports.totalExpenses'), formatCurrencyWithSymbol(totalExpenses)],
          [t('reports.avgExpensesPerDay'), formatCurrencyWithSymbol(avgExpenses)],
          [t('reports.totalDeposits'), formatCurrencyWithSymbol(totalDeposits)],
          [t('reports.avgDepositsPerDay'), formatCurrencyWithSymbol(avgDeposits)],
          [t('reports.totalWithdrawals'), formatCurrencyWithSymbol(totalWithdrawals)],
          [t('reports.avgWithdrawalsPerDay'), formatCurrencyWithSymbol(avgWithdrawals)],
          [t('reports.avgCashBalance'), formatCurrencyWithSymbol(avgCashBalance)]
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
          margin: { left: 4, right: 4 }
        });

        // Overdue Clients Section
        const simpleOverdueClients = report.data.overdueClients || [];
        if (simpleOverdueClients.length > 0) {
          if (startY > 170) { doc.addPage(); startY = 20; }
          startY = (doc as any).lastAutoTable?.finalY || startY;
          startY += 8;
          doc.setFontSize(12);
          doc.setTextColor(220, 53, 69);
          doc.text(t('reports.overdueClients'), 4, startY);
          startY += 6;

          autoTable(doc, {
            startY,
            head: [[t('reports.client'), t('reports.creditValue'), t('reports.tax'), t('reports.remainingDebt'), t('reports.overdue')]],
            body: simpleOverdueClients.map(oc => [
              oc.clientName,
              formatCurrencyWithSymbol(oc.initialValue),
              `${oc.tax}%`,
              formatCurrencyWithSymbol(oc.remainingDebt),
              oc.overdue ? t('reports.overdue') : '-',
            ]),
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69], textColor: 255, fontSize: 7 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 4, right: 4 }
          });
        }

        setPdfDoc(doc);
        setPdfFileName(`relatorio-simplificado-${report.periodStart}-${report.periodEnd}.pdf`);
        setShowPdfModal(true);
        return;
      }

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

        // Overdue clients for this day
        if (day.overdueClients && day.overdueClients.length > 0) {
          doc.setFontSize(10);
          doc.setTextColor(220, 53, 69);
          doc.text(t('reports.overdueClients'), 14, startY);
          startY += 5;
          const overdueDayRows = day.overdueClients.map(oc => [
            oc.clientName + (oc.clientShop ? ` (${oc.clientShop})` : ''),
            formatCurrencyWithSymbol(oc.expectedPayment),
            formatCurrencyWithSymbol(oc.amountPaid),
            formatCurrencyWithSymbol(oc.remainingDebt),
            oc.overdue ? t('reports.overdue') : '-',
          ]);
          autoTable(doc, {
            startY,
            head: [[t('reports.client'), t('reports.expectedPayment'), t('reports.amountPaid'), t('reports.remainingDebt'), t('reports.overdue')]],
            body: overdueDayRows,
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69], textColor: 255, fontSize: 8 },
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

      // Weekly overdue summary for WEEKLY_BY_ROUTE
      const weeklyOverdue = report.data.weeklyOverdueClients || [];
      if (weeklyOverdue.length > 0) {
        if (startY > 210) { doc.addPage(); startY = 20; }
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

    // Overdue Clients (for WEEKLY_GENERAL)
    const generalOverdueClients = report.data.overdueClients || [];
    if (report.reportType === 'WEEKLY_GENERAL' && generalOverdueClients.length > 0) {
      if (startY > 210) { doc.addPage(); startY = 20; }
      startY = (doc as any).lastAutoTable?.finalY || startY;
      startY += 8;
      doc.setFontSize(12);
      doc.setTextColor(220, 53, 69);
      doc.text(t('reports.overdueClients'), 14, startY);
      startY += 8;

      autoTable(doc, {
        startY,
        head: [[t('reports.client'), t('reports.creditValue'), t('reports.tax'), t('reports.remainingDebt'), t('reports.overdue')]],
        body: generalOverdueClients.map(oc => [
          oc.clientName,
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
    if (ws) {
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
    }

    setPdfDoc(doc);
    setPdfFileName(`relatorio-${report.periodStart}-${report.periodEnd}.pdf`);
    setShowPdfModal(true);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showToast(t('reports.errorGeneratingPdf'), 'danger');
    }
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
    } catch (error: any) {
      showToast(error?.message || t('reports.errorDeleting'), 'danger');
    } finally {
      setShowDeleteAlert(false);
      setReportToDelete(null);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#098947', '--color': '#fff' }}>
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

        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          {/* Simple Weekly Report - Top */}
          <div
            onClick={() => setExpandedSimpleWeekly(!expandedSimpleWeekly)}
            style={{ 
              marginBottom: '16px',
              padding: '16px 20px',
              backgroundColor: '#098947',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(9,137,71,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IonIcon icon={documentText} style={{ fontSize: '22px', color: '#fff' }} />
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                {t('reports.simpleWeekly')}
              </span>
            </div>
            <IonIcon 
              icon={expandedSimpleWeekly ? chevronUp : chevronDown} 
              style={{ fontSize: '20px', color: 'rgba(255,255,255,0.8)' }}
            />
          </div>

          {/* Expanded Content for Simple Weekly */}
          {expandedSimpleWeekly && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              marginBottom: '16px',
              padding: '16px 20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <IonSpinner name="dots" />
                    <p style={{ fontSize: '12px', color: '#666' }}>{t('reports.loading')}</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {reports.filter(r => r && r.reportType === 'SIMPLE_WEEKLY').length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonIcon icon={document} style={{ fontSize: '32px', color: '#ccc' }} />
                        <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
                          {t('reports.noReports')}
                        </p>
                      </div>
                    ) : (
                      reports.filter(r => r && r.reportType === 'SIMPLE_WEEKLY').map(report => (
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
                              <IonBadge color="success" style={{ fontSize: '10px' }}>
                                {report.data.simpleSummary?.totalPaymentsCount || 0} {t('reports.paymentsCount')}
                              </IonBadge>
                              <IonBadge color="primary" style={{ fontSize: '10px', marginLeft: '4px' }}>
                                {report.data.simpleSummary?.totalCollectedClients || 0} {t('reports.collectedClients')}
                              </IonBadge>
                              <span style={{ fontSize: '10px', color: '#666', marginLeft: '6px' }}>
                                {report.data.simpleDays?.length || 0} {t('reports.days')}
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
                    onClick={() => setShowSimpleWeeklyModal(true)}
                    style={{ height: '40px' }}
                  >
                    <IonIcon icon={addCircle} slot="start" />
                    {t('reports.generateNew')}
                  </IonButton>
                </div>
              </div>
          )}

          {/* Main Expandable Button */}
          <div
            onClick={() => setExpanded(!expanded)}
            style={{ 
              marginBottom: '16px',
              padding: '16px 20px',
              backgroundColor: '#098947',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(9,137,71,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IonIcon icon={documentText} style={{ fontSize: '22px', color: '#fff' }} />
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                {t('reports.weeklyGeneral')}
              </span>
            </div>
            <IonIcon 
              icon={expanded ? chevronUp : chevronDown} 
              style={{ fontSize: '20px', color: 'rgba(255,255,255,0.8)' }}
            />
          </div>

          {/* Expanded Content */}
          {expanded && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              marginBottom: '16px',
              padding: '16px 20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
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
                              <IonBadge color={(report.data.weeklySummary?.finalBalance ?? 0) >= 0 ? 'success' : 'danger'} style={{ fontSize: '10px' }}>
                                 {(report.data.weeklySummary?.finalBalance ?? 0) >= 0 ? '+' : ''}
                                {formatCurrencyWithSymbol(report.data.weeklySummary?.finalBalance ?? 0)}
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
                              onClick={() => handleViewPDF(report)}
                              style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                            >
                              <IonIcon icon={eye} style={{ fontSize: '18px' }} />
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
                    <IonIcon icon={addCircle} slot="start" />
                    {t('reports.generateNew')}
                  </IonButton>
                </div>
              </div>
          )}

          {/* Second Expandable Button - Weekly by Route */}
          <div
            onClick={() => setExpandedByRoute(!expandedByRoute)}
            style={{ 
              marginBottom: '16px',
              padding: '16px 20px',
              backgroundColor: '#098947',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(9,137,71,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IonIcon icon={documentText} style={{ fontSize: '22px', color: '#fff' }} />
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                {t('reports.weeklyByRoute')}
              </span>
            </div>
            <IonIcon 
              icon={expandedByRoute ? chevronUp : chevronDown} 
              style={{ fontSize: '20px', color: 'rgba(255,255,255,0.8)' }}
            />
          </div>

          {/* Expanded Content for Weekly by Route */}
          {expandedByRoute && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              marginBottom: '16px',
              padding: '16px 20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
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
                              <IonBadge color={(report.data.weeklySummary?.finalBalance ?? 0) >= 0 ? 'success' : 'danger'} style={{ fontSize: '10px' }}>
                                 {(report.data.weeklySummary?.finalBalance ?? 0) >= 0 ? '+' : ''}
                                {formatCurrencyWithSymbol(report.data.weeklySummary?.finalBalance ?? 0)}
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
                              onClick={() => handleViewPDF(report)}
                              style={{ '--padding-start': '4px', '--padding-end': '4px' } as any}
                            >
                              <IonIcon icon={eye} style={{ fontSize: '18px' }} />
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
                    <IonIcon icon={addCircle} slot="start" />
                    {t('reports.generateNew')}
                  </IonButton>
                </div>
              </div>
          )}

          {/* Fourth Expandable Button - Daily by Route */}
          <div
            onClick={() => setExpandedDailyByRoute(!expandedDailyByRoute)}
            style={{ 
              marginBottom: '16px',
              padding: '16px 20px',
              backgroundColor: '#098947',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(9,137,71,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IonIcon icon={documentText} style={{ fontSize: '22px', color: '#fff' }} />
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                {t('reports.dailyByRoute')}
              </span>
            </div>
            <IonIcon 
              icon={expandedDailyByRoute ? chevronUp : chevronDown} 
              style={{ fontSize: '20px', color: 'rgba(255,255,255,0.8)' }}
            />
          </div>

          {/* Expanded Content for Daily by Route */}
          {expandedDailyByRoute && (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              marginBottom: '16px',
              padding: '16px 20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <IonSpinner name="dots" />
                    <p style={{ fontSize: '12px', color: '#666' }}>{t('reports.loading')}</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {reports.filter(r => r && r.reportType === 'DAILY_BY_ROUTE').length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonIcon icon={document} style={{ fontSize: '32px', color: '#ccc' }} />
                        <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
                          {t('reports.noReports')}
                        </p>
                      </div>
                    ) : (
                      reports.filter(r => r && r.reportType === 'DAILY_BY_ROUTE').map(report => (
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
                              {report.periodStart}
                            </p>
                            <div style={{ marginTop: '4px' }}>
                              <IonBadge color="success" style={{ fontSize: '10px' }}>
                                {formatCurrencyWithSymbol(report.reportType === 'DAILY_BY_ROUTE' ? report.data.dailyRouteSummary?.finalCash ?? 0 : report.data.weeklySummary?.finalBalance ?? 0)}
                              </IonBadge>
                              {report.data.routeName && (
                                <span style={{ fontSize: '10px', color: '#666', marginLeft: '6px' }}>
                                  {report.data.routeName}
                                </span>
                              )}
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
                    onClick={() => {
                      setSelectedRouteDaily(null);
                      setUseDefaultDate(true);
                      setSelectedDate(getYesterday());
                      setShowDailyByRouteModal(true);
                    }}
                    style={{ height: '40px' }}
                  >
                    <IonIcon icon={addCircle} slot="start" />
                    {t('reports.generateNew')}
                  </IonButton>
                </div>
              </div>
          )}

        </div>

        {/* Generate General Modal */}
        <IonModal isOpen={showGeneralModal} onDidDismiss={() => setShowGeneralModal(false)}>
          <GreenHeader
            title={t('reports.generateWeeklyReport')}
            onClose={() => setShowGeneralModal(false)}
            
          />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              {/* Period Selection */}
              <ModernCard headerTitle={t('reports.selectPeriod')} headerIcon={calendar}>
                  <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                    <IonLabel>{t('reports.lastWeek')}</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={selectedPeriod === 'LAST_WEEK' && !useCustomDates}
                      onIonChange={() => { setSelectedPeriod('LAST_WEEK'); setUseCustomDates(false); }}
                    />
                  </IonItem>
                  <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                    <IonLabel>{t('reports.customDates')}</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={useCustomDates}
                      onIonChange={() => setUseCustomDates(!useCustomDates)}
                    />
                  </IonItem>
                  {useCustomDates && (
                    <>
                      <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                        <IonLabel position="stacked">{t('reports.periodStart')}</IonLabel>
                        <IonInput type="date" value={customStartDate} onIonChange={e => setCustomStartDate(e.detail.value || '')} />
                      </IonItem>
                      <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                        <IonLabel position="stacked">{t('reports.periodEnd')}</IonLabel>
                        <IonInput type="date" value={customEndDate} onIonChange={e => setCustomEndDate(e.detail.value || '')} />
                      </IonItem>
                    </>
                  )}
              </ModernCard>

              {/* Routes Selection */}
              <ModernCard headerTitle={t('reports.selectRoutes')}>
                  {isLoadingRoutes ? (
                    <div style={{ textAlign: 'center' }}>
                      <IonSpinner name="dots" />
                    </div>
                  ) : routes.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '14px' }}>{t('reports.noRoutes')}</p>
                  ) : (
                    <>
                      <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
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
                        <IonItem key={route.id} style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
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
              </ModernCard>

              {/* Generate Button */}
              <PrimaryButton
                onClick={handleGenerateGeneral}
                label={isGenerating ? t('reports.generating') : t('reports.generate')}
                icon={isGenerating ? undefined : addCircle}
                disabled={isGenerating || selectedRoutes.length === 0}
              />
            </div>
          </IonContent>
        </IonModal>

        {/* Generate By Route Modal */}
        <IonModal isOpen={showByRouteModal} onDidDismiss={() => setShowByRouteModal(false)}>
          <GreenHeader
            title={t('reports.weeklyByRoute')}
            onClose={() => setShowByRouteModal(false)}
            
          />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              {/* Period Selection */}
              <ModernCard headerTitle={t('reports.selectPeriod')} headerIcon={calendar}>
                  <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                    <IonLabel>{t('reports.lastWeek')}</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={selectedPeriod === 'LAST_WEEK' && !useCustomDates}
                      onIonChange={() => { setSelectedPeriod('LAST_WEEK'); setUseCustomDates(false); }}
                    />
                  </IonItem>
                  <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                    <IonLabel>{t('reports.customDates')}</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={useCustomDates}
                      onIonChange={() => setUseCustomDates(!useCustomDates)}
                    />
                  </IonItem>
                  {useCustomDates && (
                    <>
                      <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                        <IonLabel position="stacked">{t('reports.periodStart')}</IonLabel>
                        <IonInput type="date" value={customStartDate} onIonChange={e => setCustomStartDate(e.detail.value || '')} />
                      </IonItem>
                      <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                        <IonLabel position="stacked">{t('reports.periodEnd')}</IonLabel>
                        <IonInput type="date" value={customEndDate} onIonChange={e => setCustomEndDate(e.detail.value || '')} />
                      </IonItem>
                    </>
                  )}
              </ModernCard>

              {/* Single Route Selection */}
              <ModernCard headerTitle={t('reports.selectOneRoute')}>
                  {isLoadingRoutes ? (
                    <div style={{ textAlign: 'center' }}>
                      <IonSpinner name="dots" />
                    </div>
                  ) : routes.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '14px' }}>{t('reports.noRoutes')}</p>
                  ) : (
                    routes.map(route => (
                      <IonItem key={route.id} style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                        <IonLabel>{route.name}</IonLabel>
                        <IonCheckbox
                          slot="end"
                          checked={selectedRoute === route.id}
                          onIonChange={() => setSelectedRoute(route.id)}
                        />
                      </IonItem>
                    ))
                  )}
              </ModernCard>

              {/* Generate Button */}
              <PrimaryButton
                onClick={handleGenerateByRoute}
                label={isGenerating ? t('reports.generating') : t('reports.generate')}
                icon={isGenerating ? undefined : addCircle}
                disabled={isGenerating || selectedRoute === null}
              />
            </div>
          </IonContent>
        </IonModal>

        {/* Generate Simple Weekly Modal */}
        <IonModal isOpen={showSimpleWeeklyModal} onDidDismiss={() => setShowSimpleWeeklyModal(false)}>
          <GreenHeader
            title={t('reports.simpleWeekly')}
            onClose={() => setShowSimpleWeeklyModal(false)}
            
          />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              {/* Period Selection */}
              <ModernCard headerTitle={t('reports.selectPeriod')} headerIcon={calendar}>
                  <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                    <IonLabel>{t('reports.lastWeek')}</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={selectedPeriod === 'LAST_WEEK' && !useCustomDates}
                      onIonChange={() => { setSelectedPeriod('LAST_WEEK'); setUseCustomDates(false); }}
                    />
                  </IonItem>
                  <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                    <IonLabel>{t('reports.customDates')}</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={useCustomDates}
                      onIonChange={() => setUseCustomDates(!useCustomDates)}
                    />
                  </IonItem>
                  {useCustomDates && (
                    <>
                      <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                        <IonLabel position="stacked">{t('reports.periodStart')}</IonLabel>
                        <IonInput type="date" value={customStartDate} onIonChange={e => setCustomStartDate(e.detail.value || '')} />
                      </IonItem>
                      <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                        <IonLabel position="stacked">{t('reports.periodEnd')}</IonLabel>
                        <IonInput type="date" value={customEndDate} onIonChange={e => setCustomEndDate(e.detail.value || '')} />
                      </IonItem>
                    </>
                  )}
              </ModernCard>

              {/* Routes Selection */}
              <ModernCard headerTitle={t('reports.selectRoutes')}>
                  {isLoadingRoutes ? (
                    <div style={{ textAlign: 'center' }}>
                      <IonSpinner name="dots" />
                    </div>
                  ) : routes.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '14px' }}>{t('reports.noRoutes')}</p>
                  ) : (
                    <>
                      <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
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
                        <IonItem key={route.id} style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
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
              </ModernCard>

              {/* Generate Button */}
              <PrimaryButton
                onClick={handleGenerateSimpleWeekly}
                label={isGenerating ? t('reports.generating') : t('reports.generate')}
                icon={isGenerating ? undefined : addCircle}
                disabled={isGenerating || selectedRoutes.length === 0}
              />
            </div>
          </IonContent>
        </IonModal>

        {/* Generate Daily By Route Modal */}
        <IonModal isOpen={showDailyByRouteModal} onDidDismiss={() => setShowDailyByRouteModal(false)}>
          <GreenHeader
            title={t('reports.dailyByRoute')}
            onClose={() => setShowDailyByRouteModal(false)}
            
          />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              {/* Date Selection */}
              <ModernCard headerTitle={t('reports.selectDate')} headerIcon={calendar}>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                    {t('reports.selectDateOrYesterday')}
                  </p>
                  <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                    <IonLabel>{t('reports.yesterday')} ({getYesterday()})</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={useDefaultDate}
                      onIonChange={() => setUseDefaultDate(true)}
                    />
                  </IonItem>
                  <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                    <IonLabel>{t('reports.chooseDate')}</IonLabel>
                    <IonCheckbox
                      slot="end"
                      checked={!useDefaultDate}
                      onIonChange={() => setUseDefaultDate(false)}
                    />
                  </IonItem>
                  {!useDefaultDate && (
                    <IonItem style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginTop: '8px' }}>
                      <IonLabel position="stacked">{t('reports.date')}</IonLabel>
                      <IonInput
                        type="date"
                        value={selectedDate}
                        onIonChange={e => setSelectedDate(e.detail.value || '')}
                      />
                    </IonItem>
                  )}
              </ModernCard>

              {/* Single Route Selection */}
              <ModernCard headerTitle={t('reports.selectOneRoute')}>
                  {isLoadingRoutes ? (
                    <div style={{ textAlign: 'center' }}>
                      <IonSpinner name="dots" />
                    </div>
                  ) : routes.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '14px' }}>{t('reports.noRoutes')}</p>
                  ) : (
                    routes.map(route => (
                      <IonItem key={route.id} style={{ '--background': '#f5f5f5', '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px', '--min-height': '52px', marginBottom: '8px' }}>
                        <IonLabel>
                          {route.name}
                        </IonLabel>
                        <IonCheckbox
                          slot="end"
                          checked={selectedRouteDaily === route.id}
                          onIonChange={() => setSelectedRouteDaily(route.id)}
                        />
                      </IonItem>
                    ))
                  )}
              </ModernCard>

              {/* Generate Button */}
              <PrimaryButton
                onClick={handleGenerateDailyByRoute}
                label={isGenerating ? t('reports.generating') : t('reports.generate')}
                icon={isGenerating ? undefined : addCircle}
                disabled={isGenerating || selectedRouteDaily === null}
              />
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
        <PdfViewerModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          doc={pdfDoc}
          fileName={pdfFileName}
          title={t('reports.title')}
        />
      </IonContent>
    </IonPage>
  );
};

export default Reports;

