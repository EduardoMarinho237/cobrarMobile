import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonSpinner
} from '@ionic/react';
import { cog, lockClosed, download, refresh, logOut } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';

export type BlockedType = 'sunday' | 'closedDay' | 'update';

interface BlockedScreenProps {
  type: BlockedType;
  title: string;
  message: string;
  subtitle?: string;
  downloadUrl?: string;
  onAction?: () => void;
  onLogout: () => void;
  actionLoading?: boolean;
}

const BlockedScreen: React.FC<BlockedScreenProps> = ({
  type,
  title,
  message,
  subtitle,
  downloadUrl,
  onAction,
  onLogout,
  actionLoading = false
}) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case 'sunday':
        return cog;
      case 'closedDay':
        return lockClosed;
      case 'update':
        return download;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'sunday':
        return '#6c757d';
      case 'closedDay':
        return '#dc3545';
      case 'update':
        return '#3b82f6';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'sunday':
        return '#f8f9fa';
      case 'closedDay':
        return '#fef2f2';
      case 'update':
        return '#f0f9ff';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'sunday':
      case 'closedDay':
        return '#098947';
      case 'update':
        return '#3b82f6';
    }
  };

  const getActionButtonText = () => {
    switch (type) {
      case 'sunday':
        return t('pages.blockedScreen.checkAvailability');
      case 'closedDay':
        return t('pages.blockedScreen.verifyLiberation');
      case 'update':
        return t('pages.blockedScreen.download');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#098947', '--color': '#fff' } as any}>
          <IonTitle style={{ color: '#fff', fontWeight: 700, fontFamily: "'League Spartan', sans-serif" }}>
            {title}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '16px 24px 24px',
          paddingTop: 'calc(16px + var(--ion-safe-area-top, 0px))',
          backgroundColor: getBackgroundColor(),
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '24px',
            padding: '32px 24px',
            textAlign: 'center',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            marginTop: '24px',
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: `${getIconColor()}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <IonIcon
                icon={getIcon()}
                style={{ fontSize: '48px', color: getIconColor() }}
              />
            </div>

            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#262626',
              margin: '0 0 16px 0',
              fontFamily: "'League Spartan', sans-serif",
            }}>
              {title}
            </h1>

            <p style={{
              fontSize: '15px',
              color: '#666',
              lineHeight: 1.6,
              margin: '0 0 8px 0',
            }}>
              {message}
            </p>

            {subtitle && (
              <p style={{
                fontSize: '13px',
                color: '#999',
                lineHeight: 1.5,
                margin: '0 0 24px 0',
              }}>
                {subtitle}
              </p>
            )}

            {type === 'update' && downloadUrl && (
              <p style={{
                fontSize: '11px',
                color: '#999',
                wordBreak: 'break-all',
                marginBottom: '24px',
              }}>
                {downloadUrl}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              {onAction && (
                <IonButton
                  expand="block"
                  onClick={onAction}
                  disabled={actionLoading}
                  style={{
                    '--background': getButtonColor(),
                    '--background-hover': getButtonColor(),
                    '--border-radius': '14px',
                    '--padding-top': '16px',
                    '--padding-bottom': '16px',
                    '--border-width': '0',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '15px',
                  }}
                >
                  {actionLoading ? (
                    <IonSpinner name="dots" slot="start" />
                  ) : (
                    <IonIcon icon={type === 'update' ? download : refresh} slot="start" />
                  )}
                  {getActionButtonText()}
                </IonButton>
              )}

              <IonButton
                expand="block"
                onClick={onLogout}
                disabled={actionLoading}
                style={{
                  '--background': 'transparent',
                  '--background-hover': '#f5f5f5',
                  '--border-radius': '14px',
                  '--padding-top': '16px',
                  '--padding-bottom': '16px',
                  '--color': '#666',
                  '--border-width': '0',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '15px',
                }}
              >
                <IonIcon icon={logOut} slot="start" />
                {t('pages.blockedScreen.logout')}
              </IonButton>
            </div>
          </div>

          <div style={{
            backgroundColor: '#098947',
            borderRadius: '20px',
            padding: '28px 24px',
            marginTop: '24px',
            boxShadow: '0 4px 20px rgba(9,137,71,0.25)',
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '360px',
          }}>
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-20px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.08)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '-10px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{
                color: '#fff',
                fontSize: '32px',
                fontWeight: 'bold',
                margin: '0 0 4px 0',
                fontFamily: "'League Spartan', sans-serif",
                letterSpacing: '-1.5px'
              }}>
                abonopay <span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.7 }}>v{import.meta.env.VITE_APP_VERSION}</span>
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '13px',
                margin: 0,
                fontFamily: "'Futura', 'Century Gothic', 'Apple Gothic', sans-serif",
                fontWeight: 500
              }}>
                abono en la deuda, crecimiento en el bolsillo
              </p>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BlockedScreen;
