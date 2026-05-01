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
  IonInput
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { CreateClientRequest } from '../../../../services/clientApi';

interface CreateClientModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  newClient: CreateClientRequest;
  setNewClient: React.Dispatch<React.SetStateAction<CreateClientRequest>>;
  onCreate: () => void;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onDidDismiss,
  newClient,
  setNewClient,
  onCreate
}) => {
  const { t } = useTranslation();

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.clients.addClient')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>{t('common.close')}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '16px' }}>
          {(['name','cpf','phone','address','shop'] as const).map((field) => (
            <IonItem key={field}>
              <IonInput
                label={t(`pages.clients.${field}`)}
                labelPlacement="floating"
                placeholder={t(`pages.clients.${field}Placeholder`)}
                value={newClient[field]}
                onIonInput={(e: any) =>
                  setNewClient({ ...newClient, [field]: e.detail.value! })
                }
              />
            </IonItem>
          ))}
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

export default CreateClientModal;
