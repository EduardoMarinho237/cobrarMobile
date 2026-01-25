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
  IonModal,
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
import { add, create, trash } from 'ionicons/icons';
import { 
  Client, 
  CreateClientRequest, 
  UpdateClientRequest,
  getClients, 
  createClient, 
  updateClient, 
  deleteClient 
} from '../../services/clientApi';
import Toast from '../../components/Toast';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  // Form states
  const [newClient, setNewClient] = useState<CreateClientRequest>({ 
    name: '', 
    cpf: '', 
    phone: '', 
    address: '', 
    shop: '' 
  });
  const [editClient, setEditClient] = useState<UpdateClientRequest>({ 
    name: '', 
    cpf: '', 
    phone: '', 
    address: '', 
    shop: '' 
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      showToast('Erro ao carregar clientes', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handleCreateClient = async () => {
    if (!newClient.name.trim()) {
      showToast('O nome do cliente é obrigatório', 'danger');
      return;
    }

    try {
      const response = await createClient(newClient);
      if (response.success) {
        showToast('Cliente criado com sucesso', 'success');
        setShowCreateModal(false);
        setNewClient({ name: '', cpf: '', phone: '', address: '', shop: '' });
        loadClients();
      } else {
        showToast(response.message || 'Erro ao criar cliente', 'danger');
      }
    } catch (error) {
      showToast('Erro ao criar cliente', 'danger');
    }
  };

  const handleEditClient = async () => {
    if (!editClient.name.trim()) {
      showToast('O nome do cliente é obrigatório', 'danger');
      return;
    }

    if (!selectedClient) return;

    try {
      const response = await updateClient(selectedClient.id, editClient);
      if (response.success) {
        showToast('Cliente atualizado com sucesso', 'success');
        setShowEditModal(false);
        setEditClient({ name: '', cpf: '', phone: '', address: '', shop: '' });
        setSelectedClient(null);
        loadClients();
      } else {
        showToast(response.message || 'Erro ao atualizar cliente', 'danger');
      }
    } catch (error) {
      showToast('Erro ao atualizar cliente', 'danger');
    }
  };

  const handleDeleteClient = () => {
    if (!selectedClient) return;

    deleteClient(selectedClient.id)
      .then(response => {
        showToast(response.message || 'Cliente excluído com sucesso', response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedClient(null);
          loadClients();
        }
      })
      .catch((error) => {
        console.error('Erro ao excluir cliente:', error);
        showToast('Erro de conexão, tente novamente', 'danger');
      });
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setEditClient({ 
      name: client.name, 
      cpf: client.cpf, 
      phone: client.phone, 
      address: client.address, 
      shop: client.shop 
    });
    setShowEditModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Clientes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={loadClients}>
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
            Adicionar Cliente
          </IonButton>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', marginTop: '16px' }}>Carregando clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Nenhum cliente cadastrado ainda</p>
            </div>
          ) : (
            clients.map((client) => (
              <IonCard 
                key={client.id} 
                style={{ 
                  marginBottom: '16px',
                  borderRadius: '12px'
                }}
              >
                <IonCardHeader>
                  <IonCardTitle>{client.name}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>CPF: {client.cpf || 'Não informado'}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Telefone: {client.phone || 'Não informado'}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Loja: {client.shop || 'Não informada'}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Endereço: {client.address || 'Não informado'}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Créditos: {client.creditsCount}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Débitos: {client.debitsCount}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Saldo: {formatCurrency(client.totalCreditsValue - client.totalDebitsValue)}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol size="6">
                        <IonButton
                          fill="clear"
                          onClick={() => openEditModal(client)}
                        >
                          <IonIcon icon={create} />
                        </IonButton>
                      </IonCol>
                      <IonCol size="6">
                        <IonButton
                          fill="clear"
                          color="danger"
                          onClick={() => {
                            setSelectedClient(client);
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
            ))
          )}
        </div>

        {/* Modal Criar Cliente */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Adicionar Cliente</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonInput
                  label="Nome *"
                  labelPlacement="floating"
                  placeholder="Nome do cliente"
                  value={newClient.name}
                  onIonInput={(e: any) => setNewClient({ ...newClient, name: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="CPF"
                  labelPlacement="floating"
                  placeholder="000.000.000-00"
                  value={newClient.cpf}
                  onIonInput={(e: any) => setNewClient({ ...newClient, cpf: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Telefone"
                  labelPlacement="floating"
                  placeholder="(00) 00000-0000"
                  value={newClient.phone}
                  onIonInput={(e: any) => setNewClient({ ...newClient, phone: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Endereço"
                  labelPlacement="floating"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={newClient.address}
                  onIonInput={(e: any) => setNewClient({ ...newClient, address: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Loja"
                  labelPlacement="floating"
                  placeholder="Nome da loja"
                  value={newClient.shop}
                  onIonInput={(e: any) => setNewClient({ ...newClient, shop: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleCreateClient}
                style={{ marginTop: '16px' }}
              >
                Criar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Cliente */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Editar Cliente</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonInput
                  label="Nome *"
                  labelPlacement="floating"
                  placeholder="Nome do cliente"
                  value={editClient.name}
                  onIonInput={(e: any) => setEditClient({ ...editClient, name: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="CPF"
                  labelPlacement="floating"
                  placeholder="000.000.000-00"
                  value={editClient.cpf}
                  onIonInput={(e: any) => setEditClient({ ...editClient, cpf: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Telefone"
                  labelPlacement="floating"
                  placeholder="(00) 00000-0000"
                  value={editClient.phone}
                  onIonInput={(e: any) => setEditClient({ ...editClient, phone: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Endereço"
                  labelPlacement="floating"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={editClient.address}
                  onIonInput={(e: any) => setEditClient({ ...editClient, address: e.detail.value! })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Loja"
                  labelPlacement="floating"
                  placeholder="Nome da loja"
                  value={editClient.shop}
                  onIonInput={(e: any) => setEditClient({ ...editClient, shop: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleEditClient}
                style={{ marginTop: '16px' }}
              >
                Atualizar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Excluir */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirmar"
          message={`Tem certeza que deseja excluir o cliente "${selectedClient?.name}"?`}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Confirmar',
              handler: handleDeleteClient
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

export default Clients;