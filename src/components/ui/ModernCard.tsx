import React from 'react';
import { IonIcon } from '@ionic/react';

interface ModernCardProps {
  headerIcon?: string;
  headerTitle?: string;
  headerColor?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const ModernCard: React.FC<ModernCardProps> = ({ headerIcon, headerTitle, headerColor = '#098947', children, style }) => (
  <div style={{
    backgroundColor: '#fff',
    borderRadius: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    ...style
  }}>
    {headerTitle && (
      <div style={{
        backgroundColor: headerColor,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {headerIcon && (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IonIcon icon={headerIcon} style={{ fontSize: '22px', color: '#fff' }} />
          </div>
        )}
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
          {headerTitle}
        </span>
      </div>
    )}
    <div style={{ padding: '16px 20px' }}>
      {children}
    </div>
  </div>
);

export default ModernCard;
