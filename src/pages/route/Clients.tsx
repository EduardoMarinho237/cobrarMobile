import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonModal,
} from '@ionic/react';
import Toast from '../../components/Toast';
import ListSearchHeader from '../../components/ListSearchHeader';
import PrimaryButton from '../../components/ui/PrimaryButton';
import GreenHeader from '../../components/ui/GreenHeader';
import { addCircle } from 'ionicons/icons';
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

        <div style={{ padding: '16px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 16px))' }}>
          <PrimaryButton
            onClick={() => setShowCreateModal(true)}
            label={t('pages.clients.addClient')}
            icon={addCircle}
          />

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
            backgroundColor: '#fff',
            borderTop: '1px solid #e8e8e8',
            padding: '12px 16px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 12px))',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxSizing: 'border-box',
            cursor: 'pointer',
            boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <span style={{ fontSize: '14px', color: '#555', fontWeight: 600 }}>
            {t('pages.clients.todayCredits')}
          </span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#098947' }}>
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
        <GreenHeader
          title={t('pages.clients.todayCredits')}
          onClose={() => setShowTodayCreditsModal(false)}
        />
        <IonContent>
          <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
            {todayCredits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#666' }}>{t('pages.clients.noCreditsToday')}</p>
              </div>
            ) : (
              todayCredits.map((credit) => (
                <div key={credit.id} style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '10px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: '#098947',
                    borderRadius: '12px 0 0 12px'
                  }} />
                  <div style={{ paddingLeft: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#262626', marginBottom: '10px' }}>
                      {credit.clientName}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#555' }}>{t('pages.clients.loanAmount')}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#098947' }}>
                        {formatCurrencyWithSymbol(credit.initialValue)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#555' }}>{t('pages.clients.totalAmount')}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#262626' }}>
                        {formatCurrencyWithSymbol(credit.totalDebt)}
                      </span>
                    </div>
                  </div>
                </div>
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