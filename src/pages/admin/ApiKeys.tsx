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
import { add, trash, copy, key, refresh } from 'ionicons/icons';
import { getApiKeys, generateApiKey, revokeApiKey, ApiKey } from '../../services/apiKeyApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';

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
        <IonToolbar>
          <IonTitle>{t('pages.apiKeys.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={loadKeys}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px' }}>
          <p style={{ color: '#666', marginBottom: '16px' }}>{t('pages.apiKeys.description')}</p>

          <IonButton
            expand="block"
            shape="round"
            onClick={() => setShowGenerateModal(true)}
            style={{ marginBottom: '16px' }}
          >
            <IonIcon slot="start" icon={add} />
            {t('pages.apiKeys.generateKey')}
          </IonButton>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
            </div>
          ) : keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('pages.apiKeys.noKeys')}</p>
            </div>
          ) : (
            <>
              {activeKeys.length > 0 && (
                <>
                  <h3 style={{ marginBottom: '12px', color: '#28a745' }}>
                    {t('pages.apiKeys.activeKeys')} ({activeKeys.length})
                  </h3>
                  {activeKeys.map((apiKey) => (
                    <IonCard key={apiKey.id} style={{ marginBottom: '16px', borderRadius: '12px' }}>
                      <IonCardHeader>
                        <IonCardTitle style={{ fontSize: '16px' }}>
                          {apiKey.description}
                          <IonBadge color="success" style={{ marginLeft: '8px' }}>{t('pages.apiKeys.active')}</IonBadge>
                        </IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.apiKeys.maskedKey')}:</h3>
                            <p style={{ fontFamily: 'monospace', fontSize: '14px' }}>{apiKey.maskedKey}</p>
                          </IonLabel>
                        </IonItem>
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.apiKeys.createdAt')}: {formatDate(apiKey.createdAt)}</h3>
                          </IonLabel>
                        </IonItem>
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.apiKeys.expiresAt')}: {formatDate(apiKey.expiresAt)}</h3>
                          </IonLabel>
                        </IonItem>
                        <IonButton
                          fill="clear"
                          color="danger"
                          onClick={() => {
                            setSelectedKey(apiKey);
                            setShowRevokeAlert(true);
                          }}
                        >
                          <IonIcon icon={trash} slot="start" />
                          {t('pages.apiKeys.revoke')}
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </>
              )}

              {revokedKeys.length > 0 && (
                <>
                  <h3 style={{ marginBottom: '12px', color: '#6c757d' }}>
                    {t('pages.apiKeys.revokedKeys')} ({revokedKeys.length})
                  </h3>
                  {revokedKeys.map((apiKey) => (
                    <IonCard key={apiKey.id} style={{ marginBottom: '16px', borderRadius: '12px', opacity: 0.6 }}>
                      <IonCardHeader>
                        <IonCardTitle style={{ fontSize: '16px' }}>
                          {apiKey.description}
                          <IonBadge color="medium" style={{ marginLeft: '8px' }}>{t('pages.apiKeys.revoked')}</IonBadge>
                        </IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.apiKeys.maskedKey')}:</h3>
                            <p style={{ fontFamily: 'monospace', fontSize: '14px' }}>{apiKey.maskedKey}</p>
                          </IonLabel>
                        </IonItem>
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.apiKeys.createdAt')}: {formatDate(apiKey.createdAt)}</h3>
                          </IonLabel>
                        </IonItem>
                        {apiKey.revokedAt && (
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.apiKeys.revokedAt')}: {formatDate(apiKey.revokedAt)}</h3>
                            </IonLabel>
                          </IonItem>
                        )}
                      </IonCardContent>
                    </IonCard>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Modal Gerar Chave */}
        <IonModal isOpen={showGenerateModal} onDidDismiss={() => { setShowGenerateModal(false); setDescription(''); }}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.apiKeys.generateKey')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => { setShowGenerateModal(false); setDescription(''); }}>{t('pages.apiKeys.cancel')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonInput
                  label={t('pages.apiKeys.keyDescription')}
                  labelPlacement="floating"
                  placeholder={t('pages.apiKeys.keyDescriptionPlaceholder')}
                  value={description}
                  onIonInput={(e: any) => setDescription(e.detail.value!)}
                />
              </IonItem>
              <IonButton
                expand="block"
                shape="round"
                onClick={handleGenerate}
                disabled={generating}
                style={{ marginTop: '16px' }}
              >
                {generating ? <IonSpinner name="dots" /> : t('pages.apiKeys.generate')}
              </IonButton>
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
