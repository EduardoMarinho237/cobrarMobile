import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CapacitorHttp, Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { logout } from '../services/api';

interface AppUpdateScreenProps {
  message: string;
  downloadUrl: string;
  onDismiss: () => void;
}

const AppUpdateScreen: React.FC<AppUpdateScreenProps> = ({ message, downloadUrl, onDismiss }) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Detecta se estamos em plataforma nativa Capacitor
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const handleUpdate = async () => {
    if (!isNative) {
      // Modo desenvolvimento/navegador: apenas recarrega a página
      console.log('[AppUpdate] Modo web - recarregando página');
      window.location.reload();
      return;
    }

    // Modo nativo: baixar APK e instalar
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      console.log('[AppUpdate] Iniciando download do APK:', downloadUrl);

      // Opção 1: Tentar baixar via CapacitorHttp e salvar com Filesystem
      const filename = 'app-update.apk';

      // Baixar o arquivo como arraybuffer
      const response = await CapacitorHttp.get({
        url: downloadUrl,
        responseType: 'arraybuffer',
      });

      if (response.status !== 200 || !response.data) {
        throw new Error('Falha no download do APK');
      }

      setDownloadProgress(50);

      // Converter base64 para salvar no filesystem
      const base64Data = response.data;

      // Salvar no diretório externo (downloads)
      await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.External,
        recursive: true,
      });

      setDownloadProgress(100);
      console.log('[AppUpdate] APK salvo em Downloads/', filename);

      // Tentar abrir o APK para instalação
      const fileUri = await Filesystem.getUri({
        path: filename,
        directory: Directory.External,
      });

      // Abrir o arquivo APK no instalador do Android
      // Usamos window.open com intent para forçar o instalador
      const intentUrl = `intent://${fileUri.uri.replace('file://', '')}#Intent;action=android.intent.action.VIEW;type=application/vnd.android.package-archive;end`;
      window.open(intentUrl, '_system');

      // Se o intent falhar, abrimos o link direto
      setTimeout(() => {
        window.open(downloadUrl, '_system');
      }, 1000);

    } catch (error) {
      console.error('[AppUpdate] Erro no download:', error);
      // Fallback: abrir o link diretamente no navegador/sistema
      window.open(downloadUrl, '_system');
    } finally {
      setIsDownloading(false);
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
      {/* Ícone de atualização */}
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

      {/* Título */}
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

      {/* Mensagem da API */}
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

      {/* URL do download (para debug) */}
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

      {/* Progresso de download */}
      {isDownloading && (
        <div style={{ width: '100%', maxWidth: '320px', marginBottom: '24px' }}>
          <div
            style={{
              height: '8px',
              backgroundColor: '#1e293b',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${downloadProgress}%`,
                backgroundColor: '#3b82f6',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
            {t('appUpdate.downloading')}
          </p>
        </div>
      )}

      {/* Botões */}
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

      {/* Nota de rodapé */}
      <p
        style={{
          color: '#475569',
          fontSize: '12px',
          marginTop: '32px',
          maxWidth: '320px',
        }}
      >
        {isNative
          ? t('appUpdate.nativeNote')
          : t('appUpdate.webNote')}
      </p>
    </div>
  );
};

export default AppUpdateScreen;
