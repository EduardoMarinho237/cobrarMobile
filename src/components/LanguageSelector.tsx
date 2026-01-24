import React from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  label?: string;
  placeholder?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  label, 
  placeholder 
}) => {
  const { t } = useTranslation();
  const { changeLanguage, getCurrentLanguage, getAvailableLanguages } = useLanguage();
  const currentLanguage = getCurrentLanguage();
  const availableLanguages = getAvailableLanguages();

  return (
    <IonSelect 
      label={label || t('config.language')} 
      labelPlacement="floating"
      value={currentLanguage}
      placeholder={placeholder || t('config.language')}
      onIonChange={(e) => changeLanguage(e.detail.value)}
    >
      {availableLanguages.map((lang) => (
        <IonSelectOption key={lang.code} value={lang.code}>
          {lang.name}
        </IonSelectOption>
      ))}
    </IonSelect>
  );
};

export default LanguageSelector;
