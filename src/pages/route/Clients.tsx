import React from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/react';
import { add } from 'ionicons/icons';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';

import { useClients } from './clients/hooks/useClients';
import ClientCard from './clients/components/ClientCard';
import CreateClientModal from './clients/components/CreateClientModal';
import EditClientModal from './clients/components/EditClientModal';
import CreditModal from './clients/components/CreditModal';
import ClientCreditsModal from './clients/components/ClientCreditsModal';
import CreditViewModal from './clients/components/CreditViewModal';

const Clients: React.FC = () => {
  const { t } = useTranslation();
  const {
    clients,
    isLoading,
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.clients.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={loadClients}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          <IonButton
            expand="block"
            shape="round"
            onClick={() => setShowCreateModal(true)}
            style={{ marginBottom: '16px' }}
          >
            <IonIcon slot="start" icon={add} />
            {t('pages.clients.addClient')}
          </IonButton>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', marginTop: '16px' }}>
                {t('pages.clients.loadingClients')}
              </p>
            </div>
          ) : clients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('pages.clients.noClientsRegistered')}</p>
            </div>
          ) : (
            clients.map((client) => (
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
            ))
          )}
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