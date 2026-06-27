import React from 'react';
import {
  IonModal,
  IonContent,
  IonItem,
  IonInput
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { CreateClientRequest } from '../../../../services/clientApi';
import GreenHeader from '../../../../components/ui/GreenHeader';
import PrimaryButton from '../../../../components/ui/PrimaryButton';

interface CreateClientModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  newClient: CreateClientRequest;
  setNewClient: React.Dispatch<React.SetStateAction<CreateClientRequest>>;
  onCreate: () => void;
}

const inputStyle = {
  '--background': '#f5f5f5',
  '--border-radius': '12px',
  '--padding-start': '16px',
  '--inner-padding-end': '16px',
  '--min-height': '52px',
  marginBottom: '8px',
} as any;

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
      <GreenHeader
        title={t('pages.clients.addClient')}
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
                <IonItem key={field} style={inputStyle}>
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
              <PrimaryButton
                onClick={onCreate}
                label={t('pages.clients.create')}
                style={{ marginTop: '4px' }}
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default CreateClientModal;
