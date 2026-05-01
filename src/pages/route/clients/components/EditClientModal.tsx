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
import { UpdateClientRequest } from '../../../../services/clientApi';

interface EditClientModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  editClient: UpdateClientRequest;
  setEditClient: React.Dispatch<React.SetStateAction<UpdateClientRequest>>;
  onUpdate: () => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({
  isOpen,
  onDidDismiss,
  editClient,
  setEditClient,
  onUpdate
}) => {
  const { t } = useTranslation();

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.clients.editClient')}</IonTitle>
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
                value={editClient[field]}
                onIonInput={(e: any) =>
                  setEditClient({ ...editClient, [field]: e.detail.value! })
                }
              />
            </IonItem>
          ))}
          <IonButton
            expand="block"
            shape="round"
            onClick={onUpdate}
            style={{ marginTop: '16px' }}
          >
            {t('pages.clients.update')}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default EditClientModal;
