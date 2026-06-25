import React from 'react';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { close } from 'ionicons/icons';

interface GreenHeaderProps {
  title: string;
  onClose?: () => void;
  onAction?: () => void;
  actionIcon?: string;
  actionDisabled?: boolean;
}

const GreenHeader: React.FC<GreenHeaderProps> = ({ title, onClose, onAction, actionIcon, actionDisabled }) => (
  <IonHeader>
    <IonToolbar style={{ '--background': '#098947', '--color': '#fff' }}>
      <IonTitle>{title}</IonTitle>
      {onAction && actionIcon && (
        <IonButtons slot="start">
          <IonButton onClick={onAction} disabled={actionDisabled} style={{ color: '#fff' }}>
            <IonIcon icon={actionIcon} slot="icon-only" />
          </IonButton>
        </IonButtons>
      )}
      {onClose && (
        <IonButtons slot="end">
          <IonButton onClick={onClose} style={{ color: '#fff' }}>
            <IonIcon icon={close} />
          </IonButton>
        </IonButtons>
      )}
    </IonToolbar>
  </IonHeader>
);

export default GreenHeader;
