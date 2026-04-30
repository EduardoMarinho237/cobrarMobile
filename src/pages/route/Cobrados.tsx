import React, { useState, useEffect } from 'react';
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
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner
} from '@ionic/react';
import { refresh, timeOutline, personOutline, cashOutline } from 'ionicons/icons';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import { 
  getDebits, 
  undoDebit, 
  Debit 
} from '../../services/debitApi';
import Toast from '../../components/Toast';

import { useTranslation } from 'react-i18next';

const Cobrados: React.FC = () => {
  const { t } = useTranslation();
  const [debits, setDebits] = useState<Debit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUndoAlert, setShowUndoAlert] = useState(false);
  const [selectedDebit, setSelectedDebit] = useState<Debit | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const debitsData = await getDebits();
      // Ordenar por data (mais novo primeiro)
      const sortedDebits = debitsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setDebits(sortedDebits);
    } catch (error: any) {
      console.error('Erro ao carregar débitos:', error);
      showToast(error.message || t('pages.collected.errorLoadingDebits'), 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handleUndo = (debit: Debit) => {
    setSelectedDebit(debit);
    setShowUndoAlert(true);
  };

  const confirmUndo = async () => {
    if (!selectedDebit) return;

    try {
      const response = await undoDebit(selectedDebit.id);
      if (response.success) {
        showToast(t('pages.collected.debitUndoneSuccess'), 'success');
        setShowUndoAlert(false);
        setSelectedDebit(null);
        loadData(); // Recarregar lista
      } else {
        showToast(response.message || t('pages.collected.errorUndoingDebit'), 'danger');
      }
    } catch (error) {
      showToast(t('pages.collected.errorUndoingDebit'), 'danger');
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.collected.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="cobrados-refresher" onIonRefresh={loadData}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', marginTop: '16px' }}>{t('pages.collected.loadingCollections')}</p>
            </div>
          ) : debits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('pages.collected.noCollectionsMade')}</p>
            </div>
          ) : (
            debits.map((debit) => (
              <IonCard 
                key={debit.id} 
                style={{ 
                  marginBottom: '16px',
                  borderRadius: '12px'
                }}
              >
                <IonCardHeader>
                  <IonCardTitle>{debit.clientName}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="9">
                        <IonItem>
                          <IonIcon icon={cashOutline} style={{ marginRight: '8px', color: '#28a745' }} />
                          <IonLabel>
                            <h3 style={{ color: '#28a745' }}>
                              {formatCurrencyWithSymbol(debit.value)}
                            </h3>
                          </IonLabel>
                        </IonItem>
                        <IonItem>
                          <IonIcon icon={timeOutline} style={{ marginRight: '8px', color: '#666' }} />
                          <IonLabel>
                            <p style={{ color: '#666', fontSize: '14px' }}>
                              {formatDate(debit.createdAt)}
                            </p>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IonButton
                          color="danger"
                          size="small"
                          onClick={() => handleUndo(debit)}
                          style={{ margin: 0 }}
                        >
                          {t('pages.collected.undo')}
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>

        {/* Alert de Confirmação de Desfazer */}
        <IonAlert
          isOpen={showUndoAlert}
          onDidDismiss={() => setShowUndoAlert(false)}
          header={t('pages.collected.undoCollection')}
          message={t('pages.collected.undoCollectionMessage').replace('{value}', formatCurrencyWithSymbol(selectedDebit?.value || 0)).replace('{clientName}', selectedDebit?.clientName || 'este cliente')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('pages.collected.undo'),
              handler: confirmUndo
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

export default Cobrados;
