import React from 'react';
import { IonIcon } from '@ionic/react';

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  backgroundColor?: string;
  color?: string;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick, backgroundColor = '#f5f5f5', color = '#555', disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '10px 8px',
      border: 'none',
      borderRadius: '10px',
      backgroundColor: disabled ? '#e0e0e0' : backgroundColor,
      color: disabled ? '#bbb' : color,
      fontSize: '12px',
      fontWeight: 600,
      cursor: disabled ? 'default' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      transition: 'all 0.15s'
    }}
  >
    <IonIcon icon={icon} style={{ fontSize: '16px' }} />
    {label}
  </button>
);

export default ActionButton;
