import React, { useState } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar
} from '@ionic/react';
import { searchOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';

interface ListSearchHeaderProps {
  title: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

const ListSearchHeader: React.FC<ListSearchHeaderProps> = ({
  title,
  searchQuery,
  onSearchQueryChange
}) => {
  const { t } = useTranslation();
  const [showSearch, setShowSearch] = useState(false);

  const openSearch = () => {
    setShowSearch(true);
  };

  const closeSearch = () => {
    setShowSearch(false);
    onSearchQueryChange('');
  };

  return (
    <IonHeader>
      <IonToolbar>
        {showSearch ? (
          <IonSearchbar
            onIonInput={(e) => onSearchQueryChange(e.detail.value ?? '')}
            onIonClear={() => onSearchQueryChange('')}
            onIonCancel={closeSearch}
            showCancelButton="always"
            placeholder={t('common.searchPlaceholder')}
            debounce={150}
          />
        ) : (
          <>
            <IonTitle>{title}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={openSearch} aria-label={t('common.search')}>
                <IonIcon slot="icon-only" icon={searchOutline} />
              </IonButton>
            </IonButtons>
          </>
        )}
      </IonToolbar>
    </IonHeader>
  );
};

export default ListSearchHeader;
