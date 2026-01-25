import React from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';
import { useTranslation } from 'react-i18next';

interface LocaleSelectorProps {
  label?: string;
  placeholder?: string;
}

const LocaleSelector: React.FC<LocaleSelectorProps> = ({ 
  label, 
  placeholder 
}) => {
  const { t } = useTranslation();
  
  const getCurrentLocale = () => {
    return localStorage.getItem('timezone') || 'America/Sao_Paulo';
  };

  const changeLocale = (timezone: string) => {
    localStorage.setItem('timezone', timezone);
  };

  const locales = [
    { code: 'America/Sao_Paulo', name: t('config.timezoneBrazil') },
    { code: 'America/Bogota', name: t('config.timezoneColombia') },
    { code: 'America/New_York', name: t('config.timezoneUnitedStates') }
  ];

  const currentLocale = getCurrentLocale();

  return (
    <IonSelect 
      label={label || t('config.timezone')} 
      labelPlacement="floating"
      value={currentLocale}
      placeholder={placeholder || t('config.timezone')}
      onIonChange={(e) => changeLocale(e.detail.value)}
    >
      {locales.map((locale) => (
        <IonSelectOption key={locale.code} value={locale.code}>
          {locale.name}
        </IonSelectOption>
      ))}
    </IonSelect>
  );
};

export default LocaleSelector;
