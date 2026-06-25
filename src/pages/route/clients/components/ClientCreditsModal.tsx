import React from 'react';
import {
  IonModal,
  IonContent,
  IonProgressBar
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { Credit } from '../../../../services/creditApi';
import { Client } from '../../../../services/clientApi';
import GreenHeader from '../../../../components/ui/GreenHeader';
import InfoRow from '../../../../components/ui/InfoRow';

interface ClientCreditsModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  clientCredits: Credit[];
  selectedClient: Client | null;
  onViewCredit: (credit: Credit) => void;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
  calculateProgress: (credit: Credit) => { totalValue: number; paidValue: number; percentage: number };
}

const ClientCreditsModal: React.FC<ClientCreditsModalProps> = ({
  isOpen,
  onDidDismiss,
  clientCredits,
  selectedClient,
  onViewCredit,
  formatCurrency,
  formatDate,
  calculateProgress
}) => {
  const { t } = useTranslation();

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <GreenHeader
        title={`${t('pages.clients.credits')} - ${selectedClient?.name}`}
        onClose={onDidDismiss}
      />
      <IonContent>
        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          {clientCredits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666' }}>{t('pages.clients.noCreditsFound')}</p>
            </div>
          ) : (
            clientCredits.map((credit) => {
              const progress = calculateProgress(credit);
              return (
                <div
                  key={credit.id}
                  onClick={() => onViewCredit(credit)}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '12px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: '#098947',
                    borderRadius: '16px 0 0 16px'
                  }} />

                  <div style={{ paddingLeft: '8px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '14px'
                    }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#262626' }}>
                        {t('pages.clients.paymentProgress')}
                      </span>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: progress.percentage >= 100 ? '#28a745' : '#098947'
                      }}>
                        {progress.percentage.toFixed(1)}%
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <span style={{ fontSize: '13px', color: '#555' }}>
                        {formatCurrency(progress.paidValue)}
                      </span>
                      <span style={{ fontSize: '13px', color: '#555' }}>
                        {formatCurrency(progress.totalValue - progress.paidValue)}
                      </span>
                    </div>

                    <IonProgressBar
                      value={progress.percentage / 100}
                      color={progress.percentage >= 100 ? 'success' : 'primary'}
                      style={{ height: '10px', borderRadius: '5px', marginBottom: '16px' }}
                    />

                    <InfoRow
                      label={t('pages.clients.debtStartDate')}
                      value={formatDate(credit.startDate)}
                    />
                    <InfoRow
                      label={t('pages.clients.loanAmount')}
                      value={formatCurrency(credit.initialValue)}
                    />
                    <InfoRow
                      label={t('pages.clients.totalCredit')}
                      value={formatCurrency(progress.totalValue)}
                    />
                    <InfoRow
                      label={t('pages.clients.totalAmount')}
                      value={formatCurrency(credit.totalDebt)}
                      showBorder={false}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ClientCreditsModal;
