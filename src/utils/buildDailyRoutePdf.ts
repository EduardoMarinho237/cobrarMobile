import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Report } from '../services/reportApi';
import { formatCurrencyWithSymbol } from './currency';

export const buildDailyRoutePdf = (report: Report, t: (key: string) => string): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const data = report.data;
  const summary = data.dailyRouteSummary;
  const collections = data.collectionRows || [];
  const newCredits = data.newCreditRows || [];
  const overdueClients = data.overdueClients || [];

  // Title
  doc.setFontSize(16);
  doc.setTextColor(33, 37, 41);
  doc.text(report.title, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(108, 117, 125);
  doc.text(`${t('pages.closing.reportGeneratedAt')}: ${new Date(report.createdAt).toLocaleString('pt-BR')}`, pageWidth / 2, 27, { align: 'center' });

  // Summary Section
  let startY = 40;
  doc.setFontSize(11);
  doc.setTextColor(33, 37, 41);
  doc.text(t('pages.reports.dailySummary'), 14, startY);

  const summaryRows = [
    [t('pages.reports.initialCash'), formatCurrencyWithSymbol(summary?.initialCash || 0)],
    [t('pages.reports.collectionExpectation'), formatCurrencyWithSymbol(summary?.collectionExpectation || 0)],
    [t('pages.reports.activeClients'), String(summary?.activeClientsCount || 0)],
    [t('pages.reports.activeCredits'), String(summary?.activeCreditsCount || 0)],
    [t('pages.reports.creditsWithPayment'), String(summary?.creditsWithPayment || 0)],
    [t('pages.reports.creditsWithoutPayment'), String(summary?.creditsWithoutPayment || 0)],
    [t('pages.reports.totalCollections'), formatCurrencyWithSymbol(summary?.totalCollections || 0)],
    [t('pages.reports.newCreditsValue'), formatCurrencyWithSymbol(summary?.newCreditsValue || 0)],
    [t('pages.reports.newCreditsCount'), String(summary?.newCreditsCount || 0)],
    [t('pages.reports.totalExpenses'), formatCurrencyWithSymbol(summary?.totalExpenses || 0)],
    [t('pages.reports.totalDeposits'), formatCurrencyWithSymbol(summary?.totalDeposits || 0)],
    [t('pages.reports.totalWithdrawals'), formatCurrencyWithSymbol(summary?.totalWithdrawals || 0)],
    [t('pages.reports.finalCash'), formatCurrencyWithSymbol(summary?.finalCash || 0)],
  ];

  autoTable(doc, {
    startY: startY + 4,
    body: summaryRows,
    theme: 'grid',
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { cellWidth: 50, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  let lastY = (doc as any).lastAutoTable?.finalY || startY + 40;

  // Collections Section
  if (collections.length > 0) {
    startY = lastY + 12;
    doc.setFontSize(11);
    doc.setTextColor(33, 37, 41);
    doc.text(t('pages.reports.collections'), 14, startY);

    const collectionTableRows = collections.map((c) => [
      c.clientName,
      formatCurrencyWithSymbol(c.creditValue),
      `${c.tax}%`,
      String(c.quantityDays),
      String(c.installmentNumber),
      formatCurrencyWithSymbol(c.debitValue),
      formatCurrencyWithSymbol(c.remainingBalance),
      c.time,
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [[
        t('pages.reports.client'),
        t('pages.reports.creditValue'),
        t('pages.reports.tax'),
        t('pages.reports.days'),
        t('pages.reports.installment'),
        t('pages.reports.debitValue'),
        t('pages.reports.remaining'),
        t('pages.reports.time'),
      ]],
      body: collectionTableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 123, 255],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    lastY = (doc as any).lastAutoTable?.finalY || startY;
  }

  // New Credits Section
  if (newCredits.length > 0) {
    startY = lastY + 12;
    doc.setFontSize(11);
    doc.setTextColor(33, 37, 41);
    doc.text(t('pages.reports.newCredits'), 14, startY);

    const newCreditTableRows = newCredits.map((c) => [
      c.clientName,
      formatCurrencyWithSymbol(c.capital),
      `${c.tax}%`,
      formatCurrencyWithSymbol(c.balance),
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [[
        t('pages.reports.client'),
        t('pages.reports.capital'),
        t('pages.reports.tax'),
        t('pages.reports.balance'),
      ]],
      body: newCreditTableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [255, 193, 7],
        textColor: [33, 37, 41],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    lastY = (doc as any).lastAutoTable?.finalY || startY;
  }

  // Overdue Clients Section
  if (overdueClients.length > 0) {
    startY = lastY + 12;
    doc.setFontSize(11);
    doc.setTextColor(220, 53, 69);
    doc.text(t('pages.reports.overdueClients'), 14, startY);

    const overdueRows = overdueClients.map((c) => [
      c.clientName + (c.clientShop ? ` (${c.clientShop})` : ''),
      formatCurrencyWithSymbol(c.initialValue),
      `${c.tax}%`,
      c.startDate,
      formatCurrencyWithSymbol(c.expectedPayment),
      formatCurrencyWithSymbol(c.amountPaid),
      formatCurrencyWithSymbol(c.remainingDebt),
      c.overdue ? t('pages.reports.overdue') : '-',
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [[
        t('pages.reports.client'),
        t('pages.reports.creditValue'),
        t('pages.reports.tax'),
        t('pages.reports.creditStartDate'),
        t('pages.reports.expectedPayment'),
        t('pages.reports.amountPaid'),
        t('pages.reports.remainingDebt'),
        t('pages.reports.overdue'),
      ]],
      body: overdueRows,
      theme: 'grid',
      headStyles: {
        fillColor: [220, 53, 69],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    lastY = (doc as any).lastAutoTable?.finalY || startY;
  }

  // Footer
  const footerY = lastY + 15;
  doc.setFontSize(7);
  doc.setTextColor(108, 117, 125);
  doc.text(t('pages.closing.reportFooter'), pageWidth / 2, footerY, { align: 'center' });

  return doc;
};
