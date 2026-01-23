import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  IonGrid,
  IonRow,
  IonCol,
  IonBackButton
} from '@ionic/react';
import { add, trash, create, arrowBack } from 'ionicons/icons';
import { 
  getCategorias, 
  updateCategoria, 
  getTiposGastos, 
  createTipoGasto, 
  updateTipoGasto, 
  deleteTipoGasto,
  CategoriaGasto,
  TipoGasto 
} from '../../services/gastoApi';
import Toast from '../../components/Toast';

const EditarCategoria: React.FC = () => {
  const { categoriaId } = useParams<{ categoriaId: string }>();
  const [categoria, setCategoria] = useState<CategoriaGasto | null>(null);
  const [tipos, setTipos] = useState<TipoGasto[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoGasto | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  
  // Form states
  const [editNome, setEditNome] = useState('');
  const [newTipo, setNewTipo] = useState({ nome: '' });
  const [editTipo, setEditTipo] = useState({ nome: '' });

  useEffect(() => {
    if (categoriaId) {
      loadCategoria();
      loadTipos();
    }
  }, [categoriaId]);

  const loadCategoria = async () => {
    try {
      const categorias = await getCategorias();
      const cat = categorias.find((c: CategoriaGasto) => c.id === parseInt(categoriaId!));
      if (cat) {
        setCategoria(cat);
        setEditNome(cat.nome);
      }
    } catch (error) {
      showToast('Erro ao carregar categoria', 'danger');
    }
  };

  const loadTipos = async () => {
    try {
      const data = await getTiposGastos(parseInt(categoriaId!));
      setTipos(data);
    } catch (error) {
      showToast('Erro ao carregar tipos de gastos', 'danger');
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const validateFields = (nome: string) => {
    if (!nome.trim()) {
      showToast('Nome não pode estar vazio', 'danger');
      return false;
    }
    
    if (nome.includes(' ')) {
      showToast('Nome não pode conter espaços', 'danger');
      return false;
    }
    
    return true;
  };

  const handleUpdateCategoria = async () => {
    if (!validateFields(editNome)) {
      return;
    }

    try {
      const response = await updateCategoria(parseInt(categoriaId!), editNome);
      showToast(response.message, response.success ? 'success' : 'danger');
      
      if (response.success) {
        loadCategoria();
      }
    } catch (error) {
      showToast('Erro ao atualizar categoria', 'danger');
    }
  };

  const handleCreateTipo = async () => {
    if (!validateFields(newTipo.nome)) {
      return;
    }

    try {
      const response = await createTipoGasto(parseInt(categoriaId!), newTipo.nome);
      showToast(response.message, response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowCreateModal(false);
        setNewTipo({ nome: '' });
        loadTipos();
      }
    } catch (error) {
      showToast('Erro ao criar tipo de gasto', 'danger');
    }
  };

  const handleUpdateTipo = async () => {
    if (!validateFields(editTipo.nome) || !selectedTipo) {
      return;
    }

    try {
      const response = await updateTipoGasto(parseInt(categoriaId!), selectedTipo.id, editTipo.nome);
      showToast(response.message, response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowEditModal(false);
        setEditTipo({ nome: '' });
        setSelectedTipo(null);
        loadTipos();
      }
    } catch (error) {
      showToast('Erro ao atualizar tipo de gasto', 'danger');
    }
  };

  const handleDeleteTipo = () => {
    if (!selectedTipo) return;

    deleteTipoGasto(parseInt(categoriaId!), selectedTipo.id)
      .then(response => {
        showToast(response.message, response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedTipo(null);
          loadTipos();
        }
      })
      .catch(() => {
        showToast('Erro ao excluir tipo de gasto', 'danger');
      });
  };

  const openEditModal = (tipo: TipoGasto) => {
    setSelectedTipo(tipo);
    setEditTipo({ nome: tipo.nome });
    setShowEditModal(true);
  };

  const openDeleteAlert = (tipo: TipoGasto) => {
    setSelectedTipo(tipo);
    setShowDeleteAlert(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/manager/gastos" icon={arrowBack} />
          </IonButtons>
          <IonTitle>Editar Categoria</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px' }}>
          {/* Card da Categoria */}
          <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>Nome da Categoria</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonInput
                  value={editNome}
                  onIonInput={(e: any) => setEditNome(e.detail.value!)}
                  placeholder="Nome da categoria"
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleUpdateCategoria}
                style={{ marginTop: '16px' }}
              >
                Salvar Categoria
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Tipos de Gastos */}
          <IonCard style={{ borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>Tipos de Gastos</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonButton 
                expand="block" 
                shape="round" 
                onClick={() => setShowCreateModal(true)}
                style={{ marginBottom: '16px' }}
              >
                <IonIcon slot="start" icon={add} />
                Adicionar novo tipo
              </IonButton>

              {tipos.map((tipo) => (
                <IonItem key={tipo.id} style={{ marginBottom: '8px' }}>
                  <IonLabel>
                    <h3>{tipo.nome}</h3>
                  </IonLabel>
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => openEditModal(tipo)}
                  >
                    <IonIcon icon={create} />
                  </IonButton>
                  <IonButton
                    fill="clear"
                    color="danger"
                    slot="end"
                    onClick={() => openDeleteAlert(tipo)}
                  >
                    <IonIcon icon={trash} />
                  </IonButton>
                </IonItem>
              ))}
            </IonCardContent>
          </IonCard>
        </div>

        {/* Modal Criar Tipo */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Novo Tipo de Gasto</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="floating">Nome</IonLabel>
                <IonInput
                  value={newTipo.nome}
                  onIonInput={(e: any) => setNewTipo({ nome: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleCreateTipo}
                style={{ marginTop: '16px' }}
              >
                Criar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Tipo */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Editar Tipo de Gasto</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="floating">Nome</IonLabel>
                <IonInput
                  value={editTipo.nome}
                  onIonInput={(e: any) => setEditTipo({ nome: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleUpdateTipo}
                style={{ marginTop: '16px' }}
              >
                Salvar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Excluir Tipo */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirmar Exclusão"
          message={`Deseja realmente excluir o tipo de gasto "${selectedTipo?.nome}"?`}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Excluir',
              role: 'destructive',
              handler: handleDeleteTipo
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

export default EditarCategoria;
