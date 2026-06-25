import React from 'react';
import {
  IonModal,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonCheckbox,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { formatDateToLocalISO } from '../../../utils/dateFormat';
import GreenHeader from '../../../components/ui/GreenHeader';
import ModernCard from '../../../components/ui/ModernCard';
import PrimaryButton from '../../../components/ui/PrimaryButton';

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
    return formatDateToLocalISO(yesterday);
  };

  const canGenerate = useDefaultDate || (dailyDate && !isFutureOrToday(dailyDate) && !isSunday(dailyDate));

  const itemStyle = {
    '--background': '#f5f5f5',
    '--border-radius': '12px',
    '--padding-start': '16px',
    '--inner-padding-end': '16px',
    '--min-height': '52px',
    marginBottom: '8px',
  } as any;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <GreenHeader
        title={t('reports.dailyByRoute')}
        onClose={onClose}
      />
      <IonContent>
        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          <ModernCard headerTitle={t('reports.selectDate')}>
            <IonItem style={itemStyle}>
              <IonLabel>{t('reports.yesterday')} ({getYesterdayLabel()})</IonLabel>
              <IonCheckbox
                slot="end"
                checked={useDefaultDate}
                onIonChange={() => onUseDefaultDateChange(true)}
              />
            </IonItem>
            <IonItem style={itemStyle}>
              <IonLabel>{t('reports.chooseDate')}</IonLabel>
              <IonCheckbox
                slot="end"
                checked={!useDefaultDate}
                onIonChange={() => onUseDefaultDateChange(false)}
              />
            </IonItem>
            {!useDefaultDate && (
              <IonItem style={{ ...itemStyle, marginTop: '8px' }}>
                <IonLabel position="stacked">{t('reports.date')}</IonLabel>
                <IonInput
                  type="date"
                  value={dailyDate}
                  onIonChange={e => onDailyDateChange(e.detail.value || '')}
                />
              </IonItem>
            )}
            {!useDefaultDate && isFutureOrToday(dailyDate) && (
              <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', marginLeft: '4px' }}>
                {t('reports.errorFuture')}
              </p>
            )}
            {!useDefaultDate && isSunday(dailyDate) && (
              <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', marginLeft: '4px' }}>
                {t('reports.errorSunday')}
              </p>
            )}
          </ModernCard>

          <PrimaryButton
            onClick={onGenerate}
            label={isGenerating ? t('reports.generating') : t('reports.generate')}
            disabled={isGenerating || !canGenerate}
          />
        </div>
      </IonContent>
    </IonModal>
  );
};

export default GenerateDailyReportModal;
