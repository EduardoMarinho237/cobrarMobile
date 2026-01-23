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
  IonSelect,
  IonSelectOption,
  IonInput,
  IonModal,
  IonButtons,
  IonIcon,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { add, trash, create, eye, wallet } from 'ionicons/icons';
import { 
  getGastosDoDia, 
  createGasto, 
  updateGasto, 
  deleteGasto, 
  getTotalGastosDia,
  Gasto,
  GastoForm 
} from '../../services/gastoIndividualApi';
import { getCategorias, getTiposGastos, CategoriaGasto, TipoGasto } from '../../services/gastoApi';
import Toast from '../../components/Toast';

const GastosRoute: React.FC = () => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [totalGastos, setTotalGastos] = useState(0);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [tipos, setTipos] = useState<TipoGasto[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  
  // Form states
  const [newGasto, setNewGasto] = useState<GastoForm>({
    categoriaId: 0,
    tipoId: 0,
    valor: 0,
    descricao: ''
  });
  const [editGasto, setEditGasto] = useState<GastoForm>({
    categoriaId: 0,
    tipoId: 0,
    valor: 0,
    descricao: ''
  });

  useEffect(() => {
    loadGastos();
    loadCategorias();
  }, []);

  const loadGastos = async () => {
    try {
      const [gastosData, totalData] = await Promise.all([
        getGastosDoDia(),
        getTotalGastosDia()
      ]);
      setGastos(gastosData);
      setTotalGastos(totalData.total);
    } catch (error) {
      showToast('Erro ao carregar gastos', 'danger');
    }
  };

  const loadCategorias = async () => {
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch (error) {
      showToast('Erro ao carregar categorias', 'danger');
    }
  };

  const loadTipos = async (categoriaId: number) => {
    try {
      const data = await getTiposGastos(categoriaId);
      setTipos(data);
    } catch (error) {
      showToast('Erro ao carregar tipos', 'danger');
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const validateFields = (gasto: GastoForm) => {
    if (!gasto.categoriaId) {
      showToast('Selecione uma categoria', 'danger');
      return false;
    }
    
    if (!gasto.tipoId) {
      showToast('Selecione um tipo', 'danger');
      return false;
    }
    
    if (!gasto.valor || gasto.valor <= 0) {
      showToast('Informe um valor válido', 'danger');
      return false;
    }
    
    if (!gasto.descricao.trim()) {
      showToast('Informe uma descrição', 'danger');
      return false;
    }
    
    return true;
  };

  const handleCreateGasto = async () => {
    if (!validateFields(newGasto)) {
      return;
    }

    try {
      const response = await createGasto(newGasto);
      showToast(response.message, response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowCreateModal(false);
        setNewGasto({ categoriaId: 0, tipoId: 0, valor: 0, descricao: '' });
        setTipos([]);
        loadGastos();
      }
    } catch (error) {
      showToast('Erro ao criar gasto', 'danger');
    }
  };

  const handleUpdateGasto = async () => {
    if (!selectedGasto || !validateFields(editGasto)) {
      return;
    }

    try {
      const response = await updateGasto(selectedGasto.id, editGasto);
      showToast(response.message, response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowEditModal(false);
        setEditGasto({ categoriaId: 0, tipoId: 0, valor: 0, descricao: '' });
        setSelectedGasto(null);
        setTipos([]);
        loadGastos();
      }
    } catch (error) {
      showToast('Erro ao atualizar gasto', 'danger');
    }
  };

  const handleDeleteGasto = () => {
    if (!selectedGasto) return;

    deleteGasto(selectedGasto.id)
      .then(response => {
        showToast(response.message, response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedGasto(null);
          loadGastos();
        }
      })
      .catch(() => {
        showToast('Erro ao excluir gasto', 'danger');
      });
  };

  const handleCategoriaChange = (categoriaId: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditGasto({ ...editGasto, categoriaId, tipoId: 0 });
    } else {
      setNewGasto({ ...newGasto, categoriaId, tipoId: 0 });
    }
    
    if (categoriaId > 0) {
      loadTipos(categoriaId);
    } else {
      setTipos([]);
    }
  };

  const openEditModal = (gasto: Gasto) => {
    setSelectedGasto(gasto);
    setEditGasto({
      categoriaId: gasto.categoriaId,
      tipoId: gasto.tipoId,
      valor: gasto.valor,
      descricao: gasto.descricao
    });
    loadTipos(gasto.categoriaId);
    setShowEditModal(true);
  };

  const openDeleteAlert = (gasto: Gasto) => {
    setSelectedGasto(gasto);
    setShowDeleteAlert(true);
  };

  const openViewModal = (gasto: Gasto) => {
    setSelectedGasto(gasto);
    setShowViewModal(true);
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
          <IonTitle>Gastos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px' }}>
          {/* Card de Total do Dia */}
          <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={wallet} style={{ marginRight: '8px' }} />
                Gastos do Dia
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <h2 style={{ textAlign: 'center', color: '#dc3545', margin: '0' }}>
                {formatCurrency(totalGastos)}
              </h2>
            </IonCardContent>
          </IonCard>

          {/* Botão Adicionar */}
          <IonButton 
            expand="block" 
            shape="round" 
            onClick={() => setShowCreateModal(true)}
            style={{ marginBottom: '16px' }}
          >
            <IonIcon slot="start" icon={add} />
            Adicionar Gasto
          </IonButton>

          {/* Lista de Gastos */}
          {gastos.map((gasto) => (
            <IonCard 
              key={gasto.id} 
              style={{ 
                marginBottom: '16px',
                borderRadius: '12px'
              }}
            >
              <IonCardHeader>
                <IonCardTitle>{gasto.categoriaNome} - {gasto.tipoNome}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Valor: {formatCurrency(gasto.valor)}</h3>
                          <p>{gasto.descricao}</p>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol size="3">
                      <IonButton
                        fill="clear"
                        onClick={() => openViewModal(gasto)}
                      >
                        <IonIcon icon={eye} />
                      </IonButton>
                    </IonCol>
                    <IonCol size="3">
                      <IonButton
                        fill="clear"
                        onClick={() => openEditModal(gasto)}
                      >
                        <IonIcon icon={create} />
                      </IonButton>
                    </IonCol>
                    <IonCol size="3">
                      <IonButton
                        fill="clear"
                        color="danger"
                        onClick={() => openDeleteAlert(gasto)}
                      >
                        <IonIcon icon={trash} />
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
          ))}
        </div>

        {/* Modal Criar Gasto */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Novo Gasto</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="stacked">Categoria</IonLabel>
                <IonSelect
                  value={newGasto.categoriaId}
                  onIonChange={(e: any) => handleCategoriaChange(e.detail.value)}
                >
                  <IonSelectOption value={0}>Selecione...</IonSelectOption>
                  {categorias.map((categoria) => (
                    <IonSelectOption key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Tipo</IonLabel>
                <IonSelect
                  value={newGasto.tipoId}
                  onIonChange={(e: any) => setNewGasto({ ...newGasto, tipoId: e.detail.value })}
                  disabled={newGasto.categoriaId === 0}
                >
                  <IonSelectOption value={0}>Selecione...</IonSelectOption>
                  {tipos.map((tipo) => (
                    <IonSelectOption key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Valor</IonLabel>
                <IonInput
                  type="number"
                  value={newGasto.valor}
                  onIonInput={(e: any) => setNewGasto({ ...newGasto, valor: parseInt(e.detail.value) || 0 })}
                  placeholder="$ 100"
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Descrição</IonLabel>
                <IonInput
                  value={newGasto.descricao}
                  onIonInput={(e: any) => setNewGasto({ ...newGasto, descricao: e.detail.value! })}
                  placeholder="Descrição do gasto"
                />
              </IonItem>
              
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleCreateGasto}
                style={{ marginTop: '16px' }}
              >
                Criar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Gasto */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Editar Gasto</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="stacked">Categoria</IonLabel>
                <IonSelect
                  value={editGasto.categoriaId}
                  onIonChange={(e: any) => handleCategoriaChange(e.detail.value, true)}
                >
                  <IonSelectOption value={0}>Selecione...</IonSelectOption>
                  {categorias.map((categoria) => (
                    <IonSelectOption key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Tipo</IonLabel>
                <IonSelect
                  value={editGasto.tipoId}
                  onIonChange={(e: any) => setEditGasto({ ...editGasto, tipoId: e.detail.value })}
                  disabled={editGasto.categoriaId === 0}
                >
                  <IonSelectOption value={0}>Selecione...</IonSelectOption>
                  {tipos.map((tipo) => (
                    <IonSelectOption key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Valor</IonLabel>
                <IonInput
                  type="number"
                  value={editGasto.valor}
                  onIonInput={(e: any) => setEditGasto({ ...editGasto, valor: parseInt(e.detail.value) || 0 })}
                  placeholder="$ 100"
                />
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Descrição</IonLabel>
                <IonInput
                  value={editGasto.descricao}
                  onIonInput={(e: any) => setEditGasto({ ...editGasto, descricao: e.detail.value! })}
                  placeholder="Descrição do gasto"
                />
              </IonItem>
              
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleUpdateGasto}
                style={{ marginTop: '16px' }}
              >
                Salvar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Ver Gasto */}
        <IonModal isOpen={showViewModal} onDidDismiss={() => setShowViewModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Detalhes do Gasto</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowViewModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedGasto && (
              <div style={{ padding: '16px' }}>
                <IonCard style={{ borderRadius: '12px' }}>
                  <IonCardHeader>
                    <IonCardTitle>{selectedGasto.categoriaNome} - {selectedGasto.tipoNome}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonItem>
                      <IonLabel>
                        <h3>Valor</h3>
                        <p>{formatCurrency(selectedGasto.valor)}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Descrição</h3>
                        <p>{selectedGasto.descricao}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Data</h3>
                        <p>{new Date(selectedGasto.data).toLocaleString('pt-BR')}</p>
                      </IonLabel>
                    </IonItem>
                  </IonCardContent>
                </IonCard>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Alert Excluir Gasto */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirmar Exclusão"
          message={`Deseja realmente excluir o gasto "${selectedGasto?.descricao}"?`}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Excluir',
              role: 'destructive',
              handler: handleDeleteGasto
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

export default GastosRoute;
