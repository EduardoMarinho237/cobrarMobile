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
import { add, trash, create, eye, wallet, refresh } from 'ionicons/icons';
import { formatCurrencyWithSymbol } from '../../utils/currency';
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
import Toast from '../../components/Toast';

const Credits: React.FC = () => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  // Form states
  const [newCredit, setNewCredit] = useState<CreateCreditRequest>({ 
    initialValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    quantityDays: 1,
    clientId: 0,
    overdue: 'CAPITALIZE_DEBT'
  });
  const [editCredit, setEditCredit] = useState<UpdateCreditRequest>({ 
    initialValue: 0,
    startDate: new Date().toISOString().split('T')[0],
    quantityDays: 1,
    clientId: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [creditsData, clientsData] = await Promise.all([
        getCredits(),
        getClients()
      ]);
      setCredits(creditsData);
      
      // Ordenar clientes por nome
      const sortedClients = clientsData.sort((a: Client, b: Client) => a.name.localeCompare(b.name));
      setClients(sortedClients);
    } catch (error) {
      showToast('Erro ao carregar dados', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handleCreateCredit = async () => {
    if (!newCredit.clientId) {
      showToast('O cliente é obrigatório', 'danger');
      return;
    }

    if (newCredit.initialValue < 1) {
      showToast('O valor inicial deve ser maior que 0', 'danger');
      return;
    }

    if (newCredit.quantityDays < 1) {
      showToast('A quantidade de dias deve ser maior que 0', 'danger');
      return;
    }

    try {
      const response = await createCredit(newCredit);
      if (response.success) {
        showToast('Crédito criado com sucesso', 'success');
        setShowCreateModal(false);
        setNewCredit({ 
          initialValue: 0,
          startDate: new Date().toISOString().split('T')[0],
          quantityDays: 1,
          clientId: 0,
          overdue: 'CAPITALIZE_DEBT'
        });
        loadData();
      } else {
        showToast(response.message || 'Erro ao criar crédito', 'danger');
      }
    } catch (error) {
      showToast('Erro ao criar crédito', 'danger');
    }
  };

  const handleEditCredit = async () => {
    if (!editCredit.clientId) {
      showToast('O cliente é obrigatório', 'danger');
      return;
    }

    if (editCredit.initialValue < 1) {
      showToast('O valor inicial deve ser maior que 0', 'danger');
      return;
    }

    if (editCredit.quantityDays < 1) {
      showToast('A quantidade de dias deve ser maior que 0', 'danger');
      return;
    }

    if (!selectedCredit) return;

    try {
      const response = await updateCredit(selectedCredit.id, editCredit);
      if (response.success) {
        showToast('Crédito atualizado com sucesso', 'success');
        setShowEditModal(false);
        setEditCredit({ 
          initialValue: 0,
          startDate: new Date().toISOString().split('T')[0],
          quantityDays: 1,
          clientId: 0
        });
        setSelectedCredit(null);
        loadData();
      } else {
        showToast(response.message || 'Erro ao atualizar crédito', 'danger');
      }
    } catch (error) {
      showToast('Erro ao atualizar crédito', 'danger');
    }
  };

  const handleDeleteCredit = () => {
    if (!selectedCredit) return;

    deleteCredit(selectedCredit.id)
      .then(response => {
        showToast(response.message || 'Crédito excluído com sucesso', response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedCredit(null);
          loadData();
        }
      })
      .catch((error) => {
        console.error('Erro ao excluir crédito:', error);
        showToast('Erro de conexão, tente novamente', 'danger');
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
    return client ? client.name : 'Cliente não encontrado';
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
          <IonTitle>Créditos</IonTitle>
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
            Adicionar Crédito
          </IonButton>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', marginTop: '16px' }}>Carregando créditos...</p>
            </div>
          ) : credits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Nenhum crédito cadastrado ainda</p>
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
                            <h3>Valor Inicial: {formatCurrencyWithSymbol(credit.initialValue)}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Valor Total: {formatCurrencyWithSymbol(credit.totalDebt)}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Taxa: {credit.tax}%</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Valor Diário: {formatCurrencyWithSymbol(credit.dayValue)}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Início: {formatDate(credit.startDate)}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Término: {formatDate(credit.finalDate)}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Dias: {credit.quantityDays}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>Vencimento: {credit.overdue === 'CAPITALIZE_DEBT' ? 'Capitalizar Dívida' : 'Estender Prazo'}</h3>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                    {/* Barra de Progresso */}
                    <IonRow style={{ marginTop: '16px' }}>
                      <IonCol size="12">
                        <div style={{ padding: '0 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#666' }}>Progresso de Pagamento</span>
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
                              Pago: {formatCurrencyWithSymbol(progress.paidValue)}
                            </span>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              Total: {formatCurrencyWithSymbol(progress.totalValue)}
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
              <IonTitle>Adicionar Crédito</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonSelect
                  label="Cliente *"
                  labelPlacement="floating"
                  placeholder="Selecione um cliente"
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
                  label="Valor Inicial *"
                  labelPlacement="floating"
                  placeholder="0,00"
                  type="number"
                  value={newCredit.initialValue}
                  onIonInput={(e: any) => setNewCredit({ ...newCredit, initialValue: Number(e.detail.value) })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Data Início *"
                  labelPlacement="floating"
                  type="date"
                  value={newCredit.startDate}
                  onIonInput={(e: any) => setNewCredit({ ...newCredit, startDate: e.detail.value })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Quantidade de Dias *"
                  labelPlacement="floating"
                  placeholder="1"
                  type="number"
                  value={newCredit.quantityDays}
                  onIonInput={(e: any) => setNewCredit({ ...newCredit, quantityDays: Number(e.detail.value) })}
                />
              </IonItem>
              <IonItem>
                <IonSelect
                  label="Vencimento *"
                  labelPlacement="floating"
                  placeholder="Selecione o tipo de vencimento"
                  value={newCredit.overdue}
                  onIonChange={(e) => setNewCredit({ ...newCredit, overdue: e.detail.value as 'CAPITALIZE_DEBT' | 'EXTEND_TERM' })}
                >
                  <IonSelectOption value="CAPITALIZE_DEBT">Capitalizar Dívida</IonSelectOption>
                  <IonSelectOption value="EXTEND_TERM">Estender Prazo</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleCreateCredit}
                style={{ marginTop: '16px' }}
              >
                Criar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Crédito */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Editar Crédito</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonSelect
                  label="Cliente *"
                  labelPlacement="floating"
                  placeholder="Selecione um cliente"
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
                  label="Valor Inicial *"
                  labelPlacement="floating"
                  placeholder="0,00"
                  type="number"
                  value={editCredit.initialValue}
                  onIonInput={(e: any) => setEditCredit({ ...editCredit, initialValue: Number(e.detail.value) })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Data Início *"
                  labelPlacement="floating"
                  type="date"
                  value={editCredit.startDate}
                  onIonInput={(e: any) => setEditCredit({ ...editCredit, startDate: e.detail.value })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Quantidade de Dias *"
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
          message={`Tem certeza que deseja excluir o crédito de "${getClientName(selectedCredit?.clientId || 0)}"?`}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Confirmar',
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
