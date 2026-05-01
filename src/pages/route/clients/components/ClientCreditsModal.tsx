import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonProgressBar
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { Credit } from '../../../../services/creditApi';
import { Client } from '../../../../services/clientApi';

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
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.clients.credits')} - {selectedClient?.name}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>{t('common.close')}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '16px' }}>
          {clientCredits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('pages.clients.noCreditsFound')}</p>
            </div>
          ) : (
            clientCredits.map((credit) => {
              const progress = calculateProgress(credit);
              return (
                <IonCard
                  key={credit.id}
                  style={{
                    marginBottom: '16px',
                    borderRadius: '12px'
                  }}
                  onClick={() => onViewCredit(credit)}
                >
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        <IonCol size="12">
                          <div style={{ padding: '8px 0', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{t('pages.clients.paymentProgress')}</span>
                              <span style={{ fontSize: '18px', fontWeight: 'bold', color: progress.percentage >= 100 ? '#28a745' : '#007bff' }}>
                                {progress.percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '14px', color: '#666' }}>
                                {formatCurrency(progress.paidValue)}
                              </span>
                              <span style={{ fontSize: '14px', color: '#666' }}>
                                {formatCurrency(progress.totalValue - progress.paidValue)}
                              </span>
                            </div>
                            <IonProgressBar
                              value={progress.percentage / 100}
                              color={progress.percentage >= 100 ? 'success' : 'primary'}
                              style={{ height: '12px', borderRadius: '6px' }}
                            />
                          </div>
                        </IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.debtStartDate')}: {formatDate(credit.startDate)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.loanAmount')}: {formatCurrency(credit.initialValue)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.totalCredit')}: {formatCurrency(progress.totalValue)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.clients.totalAmount')}: {formatCurrency(credit.totalDebt)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              );
            })
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ClientCreditsModal;
