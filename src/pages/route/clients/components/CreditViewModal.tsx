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
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { Credit } from '../../../../services/creditApi';

interface CreditViewModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  selectedCredit: Credit | null;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
}

const CreditViewModal: React.FC<CreditViewModalProps> = ({
  isOpen,
  onDidDismiss,
  selectedCredit,
  formatCurrency,
  formatDate
}) => {
  const { t } = useTranslation();

  if (!selectedCredit) return null;

  const totalValue = selectedCredit.initialValue + (selectedCredit.initialValue * selectedCredit.tax / 100);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.clients.creditDetails')} #{selectedCredit.id}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>{t('common.close')}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '16px' }}>
          <IonCard style={{ borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>{t('pages.clients.credit')} #{selectedCredit.id}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <IonItem>
                      <IonLabel>
                        <h3>{t('pages.clients.debtStartDate')}: {formatDate(selectedCredit.startDate)}</h3>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12">
                    <IonItem>
                      <IonLabel>
                        <h3>{t('pages.clients.loanAmount')}: {formatCurrency(selectedCredit.initialValue)}</h3>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12">
                    <IonItem>
                      <IonLabel>
                        <h3>{t('pages.clients.totalCredit')}: {formatCurrency(totalValue)}</h3>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12">
                    <IonItem>
                      <IonLabel>
                        <h3>{t('pages.clients.totalAmount')}: {formatCurrency(selectedCredit.totalDebt)}</h3>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12">
                    <IonItem>
                      <IonLabel>
                        <h3>{t('pages.clients.interestRate')}: {selectedCredit.tax}%</h3>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12">
                    <IonItem>
                      <IonLabel>
                        <h3>{t('pages.clients.dailyValue')}: {formatCurrency(selectedCredit.dayValue)}</h3>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12">
                    <IonItem>
                      <IonLabel>
                        <h3>{t('pages.clients.startDate')}: {formatDate(selectedCredit.startDate)}</h3>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12">
                    <IonItem>
                      <IonLabel>
                        <h3>{t('pages.clients.endDate')}: {formatDate(selectedCredit.finalDate)}</h3>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12">
                    <IonItem>
                      <IonLabel>
                        <h3>{t('pages.clients.days')}: {selectedCredit.quantityDays}</h3>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default CreditViewModal;
