import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { CreateCreditRequest } from '../../../../services/creditApi';
import { Client } from '../../../../services/clientApi';

interface CreditModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  newCredit: CreateCreditRequest;
  setNewCredit: React.Dispatch<React.SetStateAction<CreateCreditRequest>>;
  onCreate: () => void;
  selectedClient: Client | null;
  currentTax: number;
}

const CreditModal: React.FC<CreditModalProps> = ({
  isOpen,
  onDidDismiss,
  newCredit,
  setNewCredit,
  onCreate,
  selectedClient,
  currentTax
}) => {
  const { t } = useTranslation();

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.clients.addCredit')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>{t('common.close')}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '16px' }}>
          <IonItem>
            <IonLabel position="stacked">{t('pages.clients.client')}</IonLabel>
            <IonLabel>
              <h2>{selectedClient?.name}</h2>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{t('pages.clients.interestRate')}</IonLabel>
            <IonLabel>
              <h3>{currentTax}%</h3>
              <p style={{ fontSize: '12px', color: '#666' }}>{t('pages.clients.currentSystemTax')}</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonInput
              label={t('pages.clients.initialValue')}
              labelPlacement="floating"
              placeholder="0,00"
              type="number"
              value={newCredit.initialValue}
              onIonInput={(e: any) => setNewCredit({ ...newCredit, initialValue: Number(e.detail.value) })}
            />
          </IonItem>
          <IonItem>
            <IonInput
              label={t('pages.clients.startDate')}
              labelPlacement="floating"
              type="date"
              value={newCredit.startDate}
              onIonInput={(e: any) => setNewCredit({ ...newCredit, startDate: e.detail.value })}
            />
          </IonItem>
          <IonItem>
            <IonInput
              label={t('pages.clients.quantityDays')}
              labelPlacement="floating"
              placeholder="1"
              type="number"
              value={newCredit.quantityDays}
              onIonInput={(e: any) => setNewCredit({ ...newCredit, quantityDays: Number(e.detail.value) })}
            />
          </IonItem>
          <IonButton
            expand="block"
            shape="round"
            onClick={onCreate}
            style={{ marginTop: '16px' }}
          >
            {t('pages.clients.create')}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default CreditModal;
