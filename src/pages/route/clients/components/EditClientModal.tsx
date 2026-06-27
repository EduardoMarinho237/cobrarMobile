import React from 'react';
import {
  IonModal,
  IonContent,
  IonItem,
  IonInput
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { UpdateClientRequest } from '../../../../services/clientApi';
import GreenHeader from '../../../../components/ui/GreenHeader';
import PrimaryButton from '../../../../components/ui/PrimaryButton';

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
      <GreenHeader
        title={t('pages.clients.editClient')}
        onClose={onDidDismiss}
      />
      <IonContent>
        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              backgroundColor: '#0c0989',
              borderRadius: '16px 0 0 16px'
            }} />
            <div style={{ paddingLeft: '8px' }}>
              {(['name','cpf','phone','address','shop'] as const).map((field) => (
                <IonItem
                  key={field}
                  style={{
                    '--background': '#f5f5f5',
                    '--border-radius': '12px',
                    '--padding-start': '16px',
                    '--inner-padding-end': '16px',
                    '--min-height': '52px',
                    marginBottom: '8px'
                  }}
                >
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
              <PrimaryButton
                onClick={onUpdate}
                label={t('pages.clients.update')}
                style={{ marginTop: '8px' }}
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default EditClientModal;
