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
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonButtons,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonProgressBar
} from '@ionic/react';
import { add, trash, create } from 'ionicons/icons';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import { todayFormatted, nextBusinessDayFormatted, isSunday } from '../../utils/sundayUtil';
import {
  Credit,
  CreateCreditRequest,
  UpdateCreditRequest,
  getCredits,
  createCredit,
  updateCredit,
  deleteCredit
} from '../../services/creditApi';
import { getClients, Client } from '../../services/clientApi';
import { getMyBalance } from '../../services/cashBoxApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';

const Credits: React.FC = () => {
  const { t } = useTranslation();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  // Form states
  const defaultStartDate = isSunday(new Date()) ? nextBusinessDayFormatted() : todayFormatted();

  const [newCredit, setNewCredit] = useState<CreateCreditRequest>({ 
    initialValue: 0,
    startDate: defaultStartDate,
    quantityDays: 1,
    clientId: 0,
    overdue: 'EXTEND_TERM'
  });

  const [editCredit, setEditCredit] = useState<UpdateCreditRequest>({
    initialValue: 0,
    startDate: defaultStartDate,
    quantityDays: 1,
    clientId: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [creditsData, clientsData, balance] = await Promise.all([
        getCredits(),
        getClients(),
        getMyBalance()
      ]);
      setCredits(creditsData);
      setCashBalance(balance);

      // Ordenar clientes por nome
      const sortedClients = clientsData.sort((a: Client, b: Client) => a.name.localeCompare(b.name));
      setClients(sortedClients);
    } catch (error) {
      showToast(t('pages.credits.errorLoadingData'), 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handleCreateCredit = async () => {
    if (!newCredit.clientId) {
      showToast(t('pages.credits.clientRequiredError'), 'danger');
      return;
    }

    if (newCredit.initialValue < 1) {
      showToast(t('pages.credits.initialValueGreaterThanZero'), 'danger');
      return;
    }

    if (newCredit.quantityDays < 1) {
      showToast(t('pages.credits.quantityDaysGreaterThanZero'), 'danger');
      return;
    }

    try {
      const response = await createCredit(newCredit);
      if (response.success) {
        showToast(t('pages.credits.creditCreatedSuccess'), 'success');
        setShowCreateModal(false);
        setNewCredit({
          initialValue: 0,
          startDate: isSunday(new Date()) ? nextBusinessDayFormatted() : todayFormatted(),
          quantityDays: 1,
          clientId: 0,
          overdue: 'EXTEND_TERM'
        });
        loadData();
      } else {
        showToast(response.message || t('pages.credits.errorCreatingCredit'), 'danger');
      }
    } catch (error) {
      showToast(t('pages.credits.errorCreatingCredit'), 'danger');
    }
  };

  const handleEditCredit = async () => {
    if (!editCredit.clientId) {
      showToast(t('pages.credits.clientRequiredError'), 'danger');
      return;
    }

    if (editCredit.initialValue < 1) {
      showToast(t('pages.credits.initialValueGreaterThanZero'), 'danger');
      return;
    }

    if (editCredit.quantityDays < 1) {
      showToast(t('pages.credits.quantityDaysGreaterThanZero'), 'danger');
      return;
    }

    if (!selectedCredit) return;

    try {
      const response = await updateCredit(selectedCredit.id, editCredit);
      if (response.success) {
        showToast(t('pages.credits.creditUpdatedSuccess'), 'success');
        setShowEditModal(false);
        setEditCredit({
          initialValue: 0,
          startDate: isSunday(new Date()) ? nextBusinessDayFormatted() : todayFormatted(),
          quantityDays: 1,
          clientId: 0
        });
        setSelectedCredit(null);
        loadData();
      } else {
        showToast(response.message || t('pages.credits.errorUpdatingCredit'), 'danger');
      }
    } catch (error) {
      showToast(t('pages.credits.errorUpdatingCredit'), 'danger');
    }
  };

  const handleDeleteCredit = () => {
    if (!selectedCredit) return;

    deleteCredit(selectedCredit.id)
      .then(response => {
        showToast(response.message || t('pages.credits.creditDeletedSuccess'), response.success ? 'success' : 'danger');

        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedCredit(null);
          loadData();
        }
      })
      .catch((error) => {
        console.error(t('pages.credits.errorUpdatingCredit'), error);
        showToast(t('pages.credits.errorConnection'), 'danger');
      });
  };

  const openEditModal = (credit: Credit) => {
    setSelectedCredit(credit);
    setEditCredit({ 
      initialValue: credit.initialValue,
      startDate: credit.startDate,
      quantityDays: credit.quantityDays,
      clientId: credit.clientId
    });
    setShowEditModal(true);
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : t('pages.credits.client');
  };

  const calculateProgress = (credit: Credit) => {
    // Valor Total = valor inicial + (valor inicial * taxa / 100)
    const totalValue = credit.initialValue + (credit.initialValue * credit.tax / 100);
    
    // Valor Pago = valor total - totalDebt atual
    const paidValue = totalValue - credit.totalDebt;
    
    // Percentual = (valor pago / valor total) × 100
    const percentage = totalValue > 0 ? (paidValue / totalValue) * 100 : 0;
    
    return {
      totalValue,
      paidValue,
      percentage: Math.min(Math.max(percentage, 0), 100) // Limitar entre 0 e 100
    };
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.credits.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={loadData}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          <IonButton 
            expand="block" 
            shape="round"
            onClick={() => setShowCreateModal(true)}
            style={{ marginBottom: '16px' }}
          >
            <IonIcon slot="start" icon={add} />
            {t('pages.credits.addCredit')}
          </IonButton>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', marginTop: '16px' }}>{t('pages.credits.loadingCredits')}</p>
            </div>
          ) : credits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('pages.credits.noCreditsRegistered')}</p>
            </div>
          ) : (
            credits.map((credit) => {
              const progress = calculateProgress(credit);
              return (
              <IonCard 
                key={credit.id} 
                style={{ 
                  marginBottom: '16px',
                  borderRadius: '12px'
                }}
              >
                <IonCardHeader>
                  <IonCardTitle>{getClientName(credit.clientId)}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.credits.initialValue')}: {formatCurrencyWithSymbol(credit.initialValue)}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.credits.totalValue')}: {formatCurrencyWithSymbol(credit.totalDebt)}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.credits.tax')}: {credit.tax}%</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.credits.dayValue')}: {formatCurrencyWithSymbol(credit.dayValue)}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.credits.start')}: {formatDate(credit.startDate)}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.credits.end')}: {formatDate(credit.finalDate)}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.credits.days')}: {credit.quantityDays}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{t('pages.credits.due')}: {credit.overdue === 'CAPITALIZE_DEBT' ? t('pages.credits.capitalizeDebt') : t('pages.credits.extendTerm')}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                    {/* Barra de Progresso */}
                    <IonRow style={{ marginTop: '16px' }}>
                      <IonCol size="12">
                        <div style={{ padding: '0 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#666' }}>{t('pages.credits.paymentProgress')}</span>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: progress.percentage >= 100 ? '#28a745' : '#007bff' }}>
                              {progress.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <IonProgressBar 
                            value={progress.percentage / 100} 
                            color={progress.percentage >= 100 ? 'success' : 'primary'}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              {t('pages.credits.paid')}: {formatCurrencyWithSymbol(progress.paidValue)}
                            </span>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              {t('pages.credits.total')}: {formatCurrencyWithSymbol(progress.totalValue)}
                            </span>
                          </div>
                        </div>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol size="6">
                        <IonButton
                          fill="clear"
                          onClick={() => openEditModal(credit)}
                        >
                          <IonIcon icon={create} />
                        </IonButton>
                      </IonCol>
                      <IonCol size="6">
                        <IonButton
                          fill="clear"
                          color="danger"
                          onClick={() => {
                            setSelectedCredit(credit);
                            setShowDeleteAlert(true);
                          }}
                        >
                          <IonIcon icon={trash} />
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            );
            })
          )}
        </div>

        {/* Modal Criar Crédito */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.credits.addCreditTitle')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonSelect
                  label={t('pages.credits.clientRequired')}
                  labelPlacement="floating"
                  placeholder={t('pages.credits.selectClient')}
                  value={newCredit.clientId}
                  onIonChange={(e) => setNewCredit({ ...newCredit, clientId: e.detail.value as number })}
                >
                  {clients.map((client) => (
                    <IonSelectOption key={client.id} value={client.id}>
                      {client.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.credits.initialValueRequired')}
                  labelPlacement="floating"
                  placeholder="0,00"
                  type="number"
                  value={newCredit.initialValue}
                  onIonInput={(e: any) => setNewCredit({ ...newCredit, initialValue: Number(e.detail.value) })}
                />
              </IonItem>
              <IonItem lines="none">
                <IonLabel>{t('pages.credits.startDateRequired')}</IonLabel>
              </IonItem>
              <div style={{ display: 'flex', gap: '8px', padding: '0 16px 16px' }}>
                <IonButton
                  expand="block"
                  fill={newCredit.startDate === todayFormatted() ? 'solid' : 'outline'}
                  shape="round"
                  disabled={isSunday(new Date())}
                  onClick={() => setNewCredit({ ...newCredit, startDate: todayFormatted() })}
                  style={{ flex: 1 }}
                >
                  {t('pages.credits.today')}
                </IonButton>
                <IonButton
                  expand="block"
                  fill={newCredit.startDate === nextBusinessDayFormatted() ? 'solid' : 'outline'}
                  shape="round"
                  onClick={() => setNewCredit({ ...newCredit, startDate: nextBusinessDayFormatted() })}
                  style={{ flex: 1 }}
                >
                  {t('pages.credits.tomorrow')}
                </IonButton>
              </div>
              <IonItem>
                <IonInput
                  label={t('pages.credits.quantityDaysRequired')}
                  labelPlacement="floating"
                  placeholder="1"
                  type="number"
                  value={newCredit.quantityDays}
                  onIonInput={(e: any) => setNewCredit({ ...newCredit, quantityDays: Number(e.detail.value) })}
                />
              </IonItem>
              <IonItem>
                <IonSelect
                  label={t('pages.credits.dueTypeRequired')}
                  labelPlacement="floating"
                  placeholder={t('pages.credits.selectDueType')}
                  value={newCredit.overdue}
                  onIonChange={(e) => setNewCredit({ ...newCredit, overdue: e.detail.value as 'CAPITALIZE_DEBT' | 'EXTEND_TERM' })}
                >
                  <IonSelectOption value="CAPITALIZE_DEBT">{t('pages.credits.capitalizeDebt')}</IonSelectOption>
                  <IonSelectOption value="EXTEND_TERM">{t('pages.credits.extendTerm')}</IonSelectOption>
                </IonSelect>
              </IonItem>
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>{t('pages.credits.currentBalance')}:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{formatCurrencyWithSymbol(cashBalance)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>{t('pages.credits.amountToLend')}:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#dc3545' }}>-{formatCurrencyWithSymbol(newCredit.initialValue)}</span>
                </div>
                <div style={{ borderTop: '1px solid #dee2e6', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>{t('pages.credits.balanceAfter')}:</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: (cashBalance - newCredit.initialValue) >= 0 ? '#28a745' : '#dc3545' }}>
                    {formatCurrencyWithSymbol(cashBalance - newCredit.initialValue)}
                  </span>
                </div>
              </div>

              <IonButton
                expand="block"
                shape="round"
                onClick={handleCreateCredit}
                style={{ marginTop: '16px' }}
                color="primary"
              >
                {t('pages.credits.create')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Crédito */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.credits.editCreditTitle')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonSelect
                  label={t('pages.credits.clientRequired')}
                  labelPlacement="floating"
                  placeholder={t('pages.credits.selectClient')}
                  value={editCredit.clientId}
                  onIonChange={(e) => setEditCredit({ ...editCredit, clientId: e.detail.value as number })}
                >
                  {clients.map((client) => (
                    <IonSelectOption key={client.id} value={client.id}>
                      {client.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.credits.initialValueRequired')}
                  labelPlacement="floating"
                  placeholder="0,00"
                  type="number"
                  value={editCredit.initialValue}
                  onIonInput={(e: any) => setEditCredit({ ...editCredit, initialValue: Number(e.detail.value) })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.credits.startDateRequired')}
                  labelPlacement="floating"
                  type="date"
                  value={editCredit.startDate}
                  onIonInput={(e: any) => setEditCredit({ ...editCredit, startDate: e.detail.value })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.credits.quantityDaysRequired')}
                  labelPlacement="floating"
                  placeholder="1"
                  type="number"
                  value={editCredit.quantityDays}
                  onIonInput={(e: any) => setEditCredit({ ...editCredit, quantityDays: Number(e.detail.value) })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleEditCredit}
                style={{ marginTop: '16px' }}
              >
                {t('pages.credits.update')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Excluir */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={t('pages.credits.confirmDelete')}
          message={t('pages.credits.confirmDeleteMessage', { name: getClientName(selectedCredit?.clientId || 0) })}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('pages.credits.confirm'),
              handler: handleDeleteCredit
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

export default Credits;
