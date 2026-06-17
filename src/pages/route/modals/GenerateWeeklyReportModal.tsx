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
} from '@ionic/react';
import { useTranslation } from 'react-i18next';

interface GenerateWeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklyStart: string;
  weeklyEnd: string;
  onWeeklyStartChange: (value: string) => void;
  onWeeklyEndChange: (value: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

const GenerateWeeklyReportModal: React.FC<GenerateWeeklyReportModalProps> = ({
  isOpen,
  onClose,
  weeklyStart,
  weeklyEnd,
  onWeeklyStartChange,
  onWeeklyEndChange,
  isGenerating,
  onGenerate,
}) => {
  const { t } = useTranslation();

  const isMonday = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr + 'T00:00:00').getDay() === 1;
  };

  const isSaturday = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr + 'T00:00:00').getDay() === 6;
  };

  const isFutureOrToday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T00:00:00');
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d >= t;
  };

  const isSameWeek = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return false;
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays === 5;
  };

  const startBeforeEnd = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return false;
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    return start < end;
  };

  const mondayOk = isMonday(weeklyStart);
  const saturdayOk = isSaturday(weeklyEnd);
  const endBeforeToday = !isFutureOrToday(weeklyEnd);
  const sameWeek = isSameWeek(weeklyStart, weeklyEnd);
  const orderOk = startBeforeEnd(weeklyStart, weeklyEnd);

  const canGenerate = mondayOk && saturdayOk && endBeforeToday && sameWeek && orderOk;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('reports.weeklyByRoute')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>{t('common.cancel')}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '16px' }}>{t('reports.selectPeriod')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">{t('reports.periodStart')}</IonLabel>
              <IonInput
                type="date"
                value={weeklyStart}
                onIonChange={e => onWeeklyStartChange(e.detail.value || '')}
              />
            </IonItem>
            {!mondayOk && weeklyStart && (
              <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {t('reports.errorMondayStart')}
              </p>
            )}

            <IonItem style={{ marginTop: '8px' }}>
              <IonLabel position="stacked">{t('reports.periodEnd')}</IonLabel>
              <IonInput
                type="date"
                value={weeklyEnd}
                onIonChange={e => onWeeklyEndChange(e.detail.value || '')}
              />
            </IonItem>
            {!saturdayOk && weeklyEnd && (
              <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {t('reports.errorSaturdayEnd')}
              </p>
            )}
            {weeklyStart && weeklyEnd && !orderOk && (
              <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {t('reports.errorStartAfterEnd')}
              </p>
            )}
            {weeklyStart && weeklyEnd && orderOk && !sameWeek && mondayOk && saturdayOk && (
              <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {t('reports.errorNotSameWeek')}
              </p>
            )}
            {weeklyEnd && !endBeforeToday && (
              <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {t('reports.errorEndFuture')}
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

export default GenerateWeeklyReportModal;
