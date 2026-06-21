import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { logout } from '../services/api';

interface AppUpdateScreenProps {
  message: string;
  downloadUrl: string;
  onDismiss: () => void;
}

const AppUpdateScreen: React.FC<AppUpdateScreenProps> = ({ message, downloadUrl, onDismiss }) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const handleUpdate = async () => {
    setIsDownloading(true);
    try {
      if (isNative) {
        console.log('[AppUpdate] Abrindo URL de download:', downloadUrl);
        await AppLauncher.openUrl({ url: downloadUrl });
      } else {
        console.log('[AppUpdate] Modo web - recarregando página');
        window.location.reload();
      }
    } catch (error) {
      console.error('[AppUpdate] Erro:', error);
      window.open(downloadUrl, '_system');
    } finally {
      setIsDownloading(false);
      onDismiss();
    }
  };

  const handleLogout = async () => {
    console.log('[AppUpdate] Encerrando sessão...');
    await logout();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: '32px' }}>
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <h1
        style={{
          color: '#f8fafc',
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '16px',
          lineHeight: 1.3,
        }}
      >
        {t('appUpdate.title')}
      </h1>

      <p
        style={{
          color: '#94a3b8',
          fontSize: '16px',
          lineHeight: 1.5,
          maxWidth: '400px',
          marginBottom: '8px',
        }}
      >
        {message}
      </p>

      <p
        style={{
          color: '#64748b',
          fontSize: '12px',
          marginBottom: '32px',
          wordBreak: 'break-all',
        }}
      >
        {downloadUrl}
      </p>

      {isDownloading && (
        <div style={{ width: '100%', maxWidth: '320px', marginBottom: '24px' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
            {t('appUpdate.downloading')}
          </p>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '320px',
        }}
      >
        <button
          onClick={handleUpdate}
          disabled={isDownloading}
          style={{
            padding: '14px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isDownloading ? '#1e293b' : '#3b82f6',
            color: '#f8fafc',
            fontSize: '16px',
            fontWeight: 600,
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {isDownloading ? t('appUpdate.downloading') : t('appUpdate.updateButton')}
        </button>

        <button
          onClick={handleLogout}
          disabled={isDownloading}
          style={{
            padding: '14px 24px',
            borderRadius: '8px',
            border: '1px solid #334155',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            fontSize: '16px',
            fontWeight: 500,
            cursor: isDownloading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {t('appUpdate.logoutButton')}
        </button>
      </div>

      <p
        style={{
          color: '#475569',
          fontSize: '12px',
          marginTop: '32px',
          maxWidth: '320px',
        }}
      >
        {t('appUpdate.nativeNote')}
      </p>
    </div>
  );
};

export default AppUpdateScreen;
