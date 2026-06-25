import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonButton,
  IonAlert,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { cashOutline, peopleOutline, walletOutline, lockClosed, saveOutline } from 'ionicons/icons';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import {
  getFechamentoData,
  fecharDia,
  FechamentoData
} from '../../services/fechamentoApi';
import { getMyBalance } from '../../services/cashBoxApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';

interface CardSectionProps {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  borderColor?: string;
  subtitle?: string;
  extraInfo?: string;
}

const CardSection: React.FC<CardSectionProps> = ({ icon, label, value, valueColor = '#262626', borderColor, subtitle, extraInfo }) => (
  <div style={{
    backgroundColor: '#fff',
    borderRadius: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    borderLeft: `4px solid ${borderColor || '#098947'}`,
  }}>
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: `${borderColor || '#098947'}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <IonIcon icon={icon} style={{ fontSize: '18px', color: borderColor || '#098947' }} />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#555' }}>
          {label}
        </span>
      </div>
      <p style={{
        fontSize: '24px',
        fontWeight: 700,
        color: valueColor,
        margin: '0 0 0 44px',
      }}>
        {value}
      </p>
      {subtitle && (
        <p style={{ fontSize: '12px', color: '#999', margin: '4px 0 0 44px' }}>
          {subtitle}
        </p>
      )}
      {extraInfo && (
        <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0 44px' }}>
          {extraInfo}
        </p>
      )}
    </div>
  </div>
);

const Fechamento: React.FC = () => {
  const { t } = useTranslation();

  const [fechamentoData, setFechamentoData] = useState<FechamentoData | null>(null);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  useEffect(() => {
    loadFechamentoData();
    loadCashBalance();

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#098947', '--color': '#fff' }}>
          <IonTitle>{t('pages.closing.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" id="fechamento-refresher">
          <IonRefresherContent />
        </IonRefresher>
        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          {fechamentoData && (
            <>
              <CardSection
                icon={saveOutline}
                label={t('pages.closing.cashBoxTitle')}
                value={formatCurrencyWithSymbol(cashBalance)}
                valueColor={cashBalance >= 0 ? '#098947' : '#dc3545'}
                borderColor={cashBalance >= 0 ? '#098947' : '#dc3545'}
                subtitle={cashBalance >= 0 ? t('pages.closing.cashBoxPositive') : t('pages.closing.cashBoxNegative')}
                extraInfo={`${t('pages.closing.initialBalance')}: ${formatCurrencyWithSymbol(fechamentoData.caixaInicial)}`}
              />

              <CardSection
                icon={cashOutline}
                label={t('pages.closing.collectionExpectation')}
                value={formatCurrencyWithSymbol(fechamentoData.expectativaArrecadacao)}
                valueColor="#098947"
                borderColor="#098947"
              />

              <CardSection
                icon={walletOutline}
                label={t('pages.closing.dayCollection')}
                value={formatCurrencyWithSymbol(fechamentoData.arrecadacaoDia)}
                valueColor="#098947"
                borderColor="#098947"
              />

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  borderLeft: '4px solid #6f42c1',
                }}>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#6f42c115',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                    }}>
                      <IonIcon icon={peopleOutline} style={{ fontSize: '16px', color: '#6f42c1' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>
                      {t('pages.closing.collectedClients')}
                    </span>
                    <p style={{ fontSize: '22px', fontWeight: 700, color: '#6f42c1', margin: 0 }}>
                      {fechamentoData.clientesCobrados}/{fechamentoData.activeClientsCount}
                    </p>
                  </div>
                </div>
                <div style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  borderLeft: '4px solid #dc3545',
                }}>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#dc354515',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                    }}>
                      <IonIcon icon={walletOutline} style={{ fontSize: '16px', color: '#dc3545' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '6px' }}>
                      {t('pages.closing.dayExpenses')}
                    </span>
                    <p style={{ fontSize: '22px', fontWeight: 700, color: '#dc3545', margin: 0 }}>
                      {formatCurrencyWithSymbol(fechamentoData.gastosDia)}
                    </p>
                  </div>
                </div>
              </div>

              <IonButton
                expand="block"
                onClick={handleFecharDia}
                style={{
                  '--background': '#dc3545',
                  '--background-hover': '#c82333',
                  '--border-radius': '14px',
                  '--padding-top': '16px',
                  '--padding-bottom': '16px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '16px',
                  marginTop: '8px',
                }}
              >
                <IonIcon icon={lockClosed} slot="start" />
                {t('pages.closing.closeDay')}
              </IonButton>
            </>
          )}
        </div>

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
