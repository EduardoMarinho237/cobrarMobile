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
  IonItem,
  IonLabel,
  IonInput,
  IonSpinner,
  IonCheckbox,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';

interface GenerateDailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyDate: string;
  onDailyDateChange: (value: string) => void;
  useDefaultDate: boolean;
  onUseDefaultDateChange: (value: boolean) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

const GenerateDailyReportModal: React.FC<GenerateDailyReportModalProps> = ({
  isOpen,
  onClose,
  dailyDate,
  onDailyDateChange,
  useDefaultDate,
  onUseDefaultDateChange,
  isGenerating,
  onGenerate,
}) => {
  const { t } = useTranslation();

  const isFutureOrToday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00');
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d >= t;
  };

  const isSunday = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr + 'T00:00:00').getDay() === 0;
  };

  const getYesterdayLabel = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (yesterday.getDay() === 0) yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const canGenerate = useDefaultDate || (dailyDate && !isFutureOrToday(dailyDate) && !isSunday(dailyDate));

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('reports.dailyByRoute')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>{t('common.cancel')}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '16px' }}>{t('reports.selectDate')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel>{t('reports.yesterday')} ({getYesterdayLabel()})</IonLabel>
              <IonCheckbox
                slot="end"
                checked={useDefaultDate}
                onIonChange={() => onUseDefaultDateChange(true)}
              />
            </IonItem>
            <IonItem>
              <IonLabel>{t('reports.chooseDate')}</IonLabel>
              <IonCheckbox
                slot="end"
                checked={!useDefaultDate}
                onIonChange={() => onUseDefaultDateChange(false)}
              />
            </IonItem>
            {!useDefaultDate && (
              <IonItem style={{ marginTop: '8px' }}>
                <IonLabel position="stacked">{t('reports.date')}</IonLabel>
                <IonInput
                  type="date"
                  value={dailyDate}
                  onIonChange={e => onDailyDateChange(e.detail.value || '')}
                />
              </IonItem>
            )}
            {!useDefaultDate && isFutureOrToday(dailyDate) && (
              <p style={{ color: 'red', fontSize: '12px', marginTop: '8px' }}>
                {t('reports.errorFuture')}
              </p>
            )}
            {!useDefaultDate && isSunday(dailyDate) && (
              <p style={{ color: 'red', fontSize: '12px', marginTop: '8px' }}>
                {t('reports.errorSunday')}
              </p>
            )}
          </IonCardContent>
        </IonCard>

        <IonButton
          expand="block"
          shape="round"
          color="primary"
          onClick={onGenerate}
          disabled={isGenerating || !canGenerate}
          style={{ marginTop: '16px' }}
        >
          {isGenerating ? <IonSpinner name="dots" slot="start" /> : null}
          {isGenerating ? t('reports.generating') : t('reports.generate')}
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default GenerateDailyReportModal;
