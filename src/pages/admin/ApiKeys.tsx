import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonModal,
  IonButtons,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonSpinner
} from '@ionic/react';
import { addCircle, trash, copy } from 'ionicons/icons';
import { getApiKeys, generateApiKey, revokeApiKey, ApiKey } from '../../services/apiKeyApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import StyledInput from '../../components/ui/StyledInput';
import PrimaryButton from '../../components/ui/PrimaryButton';

const ApiKeys: React.FC = () => {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRevokeAlert, setShowRevokeAlert] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [description, setDescription] = useState('');
  const [generatedKeyValue, setGeneratedKeyValue] = useState<string | null>(null);
  const [showGeneratedAlert, setShowGeneratedAlert] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  const [generating, setGenerating] = useState(false);
  const keyInputRef = useRef<HTMLIonInputElement>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      const data = await getApiKeys();
      setKeys(data);
    } catch (error) {
      showToast(t('pages.apiKeys.errorLoadingKeys'), 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      showToast(t('pages.apiKeys.keyDescription') + ' é obrigatório', 'danger');
      return;
    }

    setGenerating(true);
    try {
      const response = await generateApiKey(description.trim());
      if (response.success && response.data) {
        setGeneratedKeyValue(response.data.apiKey);
        setShowGeneratedAlert(true);
        setShowGenerateModal(false);
        setDescription('');
        loadKeys();
      } else {
        showToast(response.message || t('pages.apiKeys.errorGeneratingKey'), 'danger');
      }
    } catch (error) {
      showToast(t('pages.apiKeys.errorGeneratingKey'), 'danger');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedKey) return;

    try {
      const response = await revokeApiKey(selectedKey.id);
      showToast(response.message || t('pages.apiKeys.revokeSuccess'), response.success ? 'success' : 'danger');
      if (response.success) {
        setShowRevokeAlert(false);
        setSelectedKey(null);
        loadKeys();
      }
    } catch (error) {
      showToast(t('pages.apiKeys.errorRevokingKey'), 'danger');
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(t('pages.apiKeys.copied'), 'success');
    } catch {
      showToast('Erro ao copiar', 'danger');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const activeKeys = keys.filter(k => k.active);
  const revokedKeys = keys.filter(k => !k.active);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
          <IonTitle>{t('pages.apiKeys.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={loadKeys}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px' }}>
          <div style={{
            backgroundColor: '#e8f5e9',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            borderLeft: '4px solid #0c0989'
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#2e7d32', lineHeight: '1.4' }}>
              {t('pages.apiKeys.description')}
            </p>
          </div>

          <IonButton
            expand="block"
            onClick={() => setShowGenerateModal(true)}
            style={{
              marginBottom: '20px',
              '--background': '#0c0989',
              '--border-radius': '14px',
              '--padding-top': '14px',
              '--padding-bottom': '14px',
              fontWeight: '600',
              textTransform: 'none',
              fontSize: '15px'
            }}
          >
            <IonIcon slot="start" icon={addCircle} />
            {t('pages.apiKeys.generateKey')}
          </IonButton>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
            </div>
          ) : keys.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: '#fff',
              borderRadius: '16px'
            }}>
              <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>{t('pages.apiKeys.noKeys')}</p>
            </div>
          ) : (
            <>
              {activeKeys.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2dd36f' }} />
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#262626' }}>
                      {t('pages.apiKeys.activeKeys')} ({activeKeys.length})
                    </h3>
                  </div>
                  {activeKeys.map((apiKey) => (
                    <div key={apiKey.id} style={{
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      padding: '18px',
                      marginBottom: '12px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#262626' }}>
                          {apiKey.description}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#2dd36f',
                          backgroundColor: '#e8f5e9',
                          padding: '4px 12px',
                          borderRadius: '20px'
                        }}>
                          {t('pages.apiKeys.active')}
                        </span>
                      </div>
                      <div style={{
                        backgroundColor: '#f5f5f5',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '10px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        color: '#555',
                        letterSpacing: '1px'
                      }}>
                        {apiKey.maskedKey}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '14px' }}>
                        <span>{t('pages.apiKeys.createdAt')}: {formatDate(apiKey.createdAt)}</span>
                        <span>{t('pages.apiKeys.expiresAt')}: {formatDate(apiKey.expiresAt)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedKey(apiKey);
                          setShowRevokeAlert(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1.5px solid #ffcdd2',
                          borderRadius: '10px',
                          backgroundColor: '#fff',
                          color: '#d32f2f',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <IonIcon icon={trash} style={{ fontSize: '16px' }} />
                        {t('pages.apiKeys.revoke')}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {revokedKeys.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#999' }} />
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#666' }}>
                      {t('pages.apiKeys.revokedKeys')} ({revokedKeys.length})
                    </h3>
                  </div>
                  {revokedKeys.map((apiKey) => (
                    <div key={apiKey.id} style={{
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      padding: '18px',
                      marginBottom: '12px',
                      opacity: 0.55,
                      boxShadow: '0 1px 6px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#262626' }}>
                          {apiKey.description}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#999',
                          backgroundColor: '#f0f0f0',
                          padding: '4px 12px',
                          borderRadius: '20px'
                        }}>
                          {t('pages.apiKeys.revoked')}
                        </span>
                      </div>
                      <div style={{
                        backgroundColor: '#f5f5f5',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '10px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        color: '#999',
                        letterSpacing: '1px',
                        textDecoration: 'line-through'
                      }}>
                        {apiKey.maskedKey}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa' }}>
                        <span>{t('pages.apiKeys.createdAt')}: {formatDate(apiKey.createdAt)}</span>
                        {apiKey.revokedAt && <span>{t('pages.apiKeys.revokedAt')}: {formatDate(apiKey.revokedAt)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Gerar Chave */}
        <IonModal isOpen={showGenerateModal} onDidDismiss={() => { setShowGenerateModal(false); setDescription(''); }}>
          <IonHeader>
            <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
              <IonTitle>{t('pages.apiKeys.generateKey')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => { setShowGenerateModal(false); setDescription(''); }} style={{ color: '#fff' }}>{t('pages.apiKeys.cancel')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '20px' }}>
              <StyledInput
                label={t('pages.apiKeys.keyDescription')}
                placeholder={t('pages.apiKeys.keyDescriptionPlaceholder')}
                value={description}
                onIonInput={(e: any) => setDescription(e.detail.value!)}
                marginBottom="24px"
              />
              <PrimaryButton
                onClick={handleGenerate}
                label={generating ? '...' : t('pages.apiKeys.generate')}
                disabled={generating}
              />
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Chave Gerada */}
        <IonAlert
          isOpen={showGeneratedAlert}
          onDidDismiss={() => setShowGeneratedAlert(false)}
          header={t('pages.apiKeys.keyGenerated')}
          message={generatedKeyValue || ''}
          buttons={[
            {
              text: t('pages.apiKeys.copyKey'),
              handler: () => {
                if (generatedKeyValue) copyToClipboard(generatedKeyValue);
              }
            },
            {
              text: t('common.ok'),
              role: 'cancel'
            }
          ]}
        />

        {/* Alert Revogar */}
        <IonAlert
          isOpen={showRevokeAlert}
          onDidDismiss={() => setShowRevokeAlert(false)}
          header={t('pages.apiKeys.confirmRevoke')}
          message={t('pages.apiKeys.confirmRevokeMessage')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('pages.apiKeys.revoke'),
              handler: handleRevoke
            }
          ]}
        />

        {/* Toast */}
        <Toast
          isOpen={toast.isOpen}
          message={toast.message}
          color={toast.color}
          onDidDismiss={() => setToast({ ...toast, isOpen: false })}
        />
      </IonContent>
    </IonPage>
  );
};

export default ApiKeys;
