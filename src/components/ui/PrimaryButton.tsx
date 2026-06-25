import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';

interface PrimaryButtonProps {
  onClick: () => void;
  label: string;
  icon?: string;
  expand?: 'block' | 'full';
  disabled?: boolean;
  style?: React.CSSProperties;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ onClick, label, icon, expand = 'block', disabled = false, style }) => (
  <IonButton
    color="primary"
    expand={expand}
    onClick={onClick}
    disabled={disabled}
    style={{
      '--background': '#098947',
      '--background-hover': '#067a3a',
      '--border-radius': '12px',
      '--padding-top': '14px',
      '--padding-bottom': '14px',
      marginBottom: '16px',
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '15px',
      ...style
    }}
  >
    {icon && <IonIcon icon={icon} slot="start" />}
    {label}
  </IonButton>
);

export default PrimaryButton;
