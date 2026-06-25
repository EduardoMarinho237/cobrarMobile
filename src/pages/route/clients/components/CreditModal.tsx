import React from 'react';
import {
  IonModal,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonLabel
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { CreateCreditRequest } from '../../../../services/creditApi';
import { Client } from '../../../../services/clientApi';
import { todayFormatted, nextBusinessDayFormatted, isSunday } from '../../../../utils/sundayUtil';
import GreenHeader from '../../../../components/ui/GreenHeader';
import PrimaryButton from '../../../../components/ui/PrimaryButton';

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
      <GreenHeader
        title={t('pages.clients.addCredit')}
        onClose={onDidDismiss}
      />
      <IonContent>
        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          {/* Client Info Card */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '12px',
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
              backgroundColor: '#098947',
              borderRadius: '16px 0 0 16px'
            }} />
            <div style={{ paddingLeft: '8px' }}>
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#999', fontWeight: 600 }}>{t('pages.clients.client')}</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#262626', marginTop: '2px' }}>
                  {selectedClient?.name}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#999', fontWeight: 600 }}>{t('pages.clients.interestRate')}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#098947' }}>{currentTax}%</span>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>{t('pages.clients.currentSystemTax')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '12px',
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
              backgroundColor: '#098947',
              borderRadius: '16px 0 0 16px'
            }} />
            <div style={{ paddingLeft: '8px' }}>
              <IonItem
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
                  label={t('pages.clients.initialValue')}
                  labelPlacement="floating"
                  placeholder="0,00"
                  type="number"
                  value={newCredit.initialValue}
                  onIonInput={(e: any) => setNewCredit({ ...newCredit, initialValue: Number(e.detail.value) })}
                />
              </IonItem>

              <IonItem
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
                  label={t('pages.clients.quantityDays')}
                  labelPlacement="floating"
                  placeholder="1"
                  type="number"
                  value={newCredit.quantityDays}
                  onIonInput={(e: any) => setNewCredit({ ...newCredit, quantityDays: Number(e.detail.value) })}
                />
              </IonItem>

              <div style={{ marginBottom: '8px', padding: '0 4px' }}>
                <IonLabel style={{ fontSize: '13px', color: '#555', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
                  {t('pages.clients.startDate')}
                </IonLabel>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <IonButton
                    expand="block"
                    fill={newCredit.startDate === todayFormatted() ? 'solid' : 'outline'}
                    shape="round"
                    disabled={isSunday(new Date())}
                    onClick={() => setNewCredit({ ...newCredit, startDate: todayFormatted() })}
                    style={{
                      flex: 1,
                      '--border-radius': '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '14px'
                    } as any}
                    color={newCredit.startDate === todayFormatted() ? 'primary' : undefined}
                  >
                    {t('pages.clients.today')}
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill={newCredit.startDate === nextBusinessDayFormatted() ? 'solid' : 'outline'}
                    shape="round"
                    onClick={() => setNewCredit({ ...newCredit, startDate: nextBusinessDayFormatted() })}
                    style={{
                      flex: 1,
                      '--border-radius': '12px',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '14px'
                    } as any}
                    color={newCredit.startDate === nextBusinessDayFormatted() ? 'primary' : undefined}
                  >
                    {t('pages.clients.tomorrow')}
                  </IonButton>
                </div>
              </div>

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

export default CreditModal;
