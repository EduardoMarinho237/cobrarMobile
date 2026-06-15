import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonItem,
  IonLabel
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Toast from '../../components/Toast';
import ListSearchHeader from '../../components/ListSearchHeader';
import { matchesSearchQuery, collectSearchableValues } from '../../utils/listSearch';
import { useTranslation } from 'react-i18next';

import { getTodayCredits, TodayCredit } from '../../services/creditApi';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import { useClients } from './clients/hooks/useClients';
import ClientCard from './clients/components/ClientCard';
import CreateClientModal from './clients/components/CreateClientModal';
import EditClientModal from './clients/components/EditClientModal';
import CreditModal from './clients/components/CreditModal';
import ClientCreditsModal from './clients/components/ClientCreditsModal';
import CreditViewModal from './clients/components/CreditViewModal';

const Clients: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const {
    clients,
    isLoading,
    isLoadingMore,
    sentinelRef,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    showDeleteAlert,
    setShowDeleteAlert,
    showCreditModal,
    setShowCreditModal,
    showClientCreditsModal,
    setShowClientCreditsModal,
    showCreditViewModal,
    setShowCreditViewModal,
    selectedClient,
    setSelectedClient,
    selectedCredit,
    toast,
    setToast,
    newClient,
    setNewClient,
    editClient,
    setEditClient,
    newCredit,
    setNewCredit,
    clientCredits,
    currentTax,
    loadClients,
    loadTodayTotal,
    isLoadingAll,
    loadAllPages,
    todayTotal,
    handleCreateClient,
    handleEditClient,
    handleDeleteClient,
    openEditModal,
    openCreditModal,
    handleCreateCredit,
    openClientCreditsModal,
    openCreditViewModal,
    formatCurrency,
    formatDate,
    calculateProgress
  } = useClients();

  const hasLoadedAllForSearch = useRef(false);
  const prevSearchQuery = useRef('');

  useEffect(() => {
    if (searchQuery && !hasLoadedAllForSearch.current) {
      hasLoadedAllForSearch.current = true;
      loadAllPages();
    }
    if (!searchQuery && prevSearchQuery.current) {
      hasLoadedAllForSearch.current = false;
      loadClients();
    }
    prevSearchQuery.current = searchQuery;
  }, [searchQuery]);

  const [todayCredits, setTodayCredits] = useState<TodayCredit[]>([]);
  const [showTodayCreditsModal, setShowTodayCreditsModal] = useState(false);

  const loadTodayCredits = async () => {
    try {
      const credits = await getTodayCredits();
      setTodayCredits(credits);
    } catch (error) {
      console.error('Erro ao carregar créditos de hoje:', error);
    }
  };

  const openTodayCreditsModal = async () => {
    await loadTodayCredits();
    setShowTodayCreditsModal(true);
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      matchesSearchQuery(searchQuery, ...collectSearchableValues(client))
    );
  }, [clients, searchQuery]);

  return (
    <IonPage>
      <ListSearchHeader
        title={t('pages.clients.title')}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      <IonContent fullscreen style={{ '--padding-bottom': '60px' } as any}>
        <IonRefresher slot="fixed" onIonRefresh={async (e) => {
          if (searchQuery) {
            hasLoadedAllForSearch.current = false;
            await loadAllPages();
          } else {
            await loadClients();
          }
          await loadTodayTotal();
          e.detail.complete();
        }}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px', paddingBottom: '80px' }}>
          <IonButton
            expand="block"
            shape="round"
            onClick={() => setShowCreateModal(true)}
            style={{ marginBottom: '16px' }}
          >
            <IonIcon slot="start" icon={add} />
            {t('pages.clients.addClient')}
          </IonButton>

          {isLoading || isLoadingAll ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', marginTop: '16px' }}>
                {isLoadingAll ? t('common.loading') : t('pages.clients.loadingClients')}
              </p>
            </div>
          ) : clients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('pages.clients.noClientsRegistered')}</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('common.noSearchResults')}</p>
            </div>
          ) : (
            <>
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onAddCredit={openCreditModal}
                  onViewCredits={openClientCreditsModal}
                  onEdit={openEditModal}
                  onDelete={(client) => {
                    setSelectedClient(client);
                    setShowDeleteAlert(true);
                  }}
                  formatCurrency={formatCurrency}
                />
              ))}
              {/* Sentinel para infinite scroll */}
              <div ref={sentinelRef} style={{ height: '40px', textAlign: 'center', padding: '10px' }}>
                {isLoadingMore && <IonSpinner name="dots" />}
              </div>
            </>
          )}
        </div>

        {/* Rodapé - Total de Créditos Criados Hoje */}
        <div
          onClick={openTodayCreditsModal}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #dee2e6',
            padding: '12px 16px',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxSizing: 'border-box',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>
            {t('pages.clients.todayCredits')}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#007bff' }}>
            {formatCurrencyWithSymbol(todayTotal)}
          </span>
        </div>
      </IonContent>

      <CreateClientModal
        isOpen={showCreateModal}
        onDidDismiss={() => setShowCreateModal(false)}
        newClient={newClient}
        setNewClient={setNewClient}
        onCreate={handleCreateClient}
      />

      <EditClientModal
        isOpen={showEditModal}
        onDidDismiss={() => setShowEditModal(false)}
        editClient={editClient}
        setEditClient={setEditClient}
        onUpdate={handleEditClient}
      />

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header={t('pages.clients.confirmDelete')}
        message={t('pages.clients.confirmDeleteMessage').replace(
          '{clientName}',
          selectedClient?.name || ''
        )}
        buttons={[
          { text: t('common.cancel'), role: 'cancel' },
          { text: t('pages.clients.confirm'), handler: handleDeleteClient }
        ]}
      />

      <CreditModal
        isOpen={showCreditModal}
        onDidDismiss={() => setShowCreditModal(false)}
        newCredit={newCredit}
        setNewCredit={setNewCredit}
        onCreate={handleCreateCredit}
        selectedClient={selectedClient}
        currentTax={currentTax}
      />

      <ClientCreditsModal
        isOpen={showClientCreditsModal}
        onDidDismiss={() => setShowClientCreditsModal(false)}
        clientCredits={clientCredits}
        selectedClient={selectedClient}
        onViewCredit={openCreditViewModal}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        calculateProgress={calculateProgress}
      />

      <CreditViewModal
        isOpen={showCreditViewModal}
        onDidDismiss={() => setShowCreditViewModal(false)}
        selectedCredit={selectedCredit}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      {/* Modal de Créditos de Hoje */}
      <IonModal isOpen={showTodayCreditsModal} onDidDismiss={() => setShowTodayCreditsModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('pages.clients.todayCredits')}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowTodayCreditsModal(false)}>{t('common.close')}</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: '16px' }}>
            {todayCredits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#666' }}>{t('pages.clients.noCreditsToday')}</p>
              </div>
            ) : (
              todayCredits.map((credit) => (
                <IonItem key={credit.id} lines="full">
                  <IonLabel>
                    <h3 style={{ fontWeight: 'bold', color: '#333' }}>{credit.clientName}</h3>
                    <p style={{ color: '#666', marginTop: '4px' }}>
                      {t('pages.clients.loanAmount')}: <strong style={{ color: '#007bff' }}>{formatCurrencyWithSymbol(credit.initialValue)}</strong>
                    </p>
                    <p style={{ color: '#666' }}>
                      {t('pages.clients.totalAmount')}: <strong>{formatCurrencyWithSymbol(credit.totalDebt)}</strong>
                    </p>
                  </IonLabel>
                </IonItem>
              ))
            )}
          </div>
        </IonContent>
      </IonModal>

      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        color={toast.color}
        onDidDismiss={() => setToast({ ...toast, isOpen: false })}
      />
    </IonPage>
  );
};

export default Clients;