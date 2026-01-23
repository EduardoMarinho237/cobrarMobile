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
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { add, trash, create, eye, arrowForward } from 'ionicons/icons';
import { getCategorias, createCategoria, deleteCategoria, CategoriaGasto } from '../../services/gastoApi';
import Toast from '../../components/Toast';

const Gastos: React.FC = () => {
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showMigrateAlert, setShowMigrateAlert] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [showConfirmDeleteAlert, setShowConfirmDeleteAlert] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaGasto | null>(null);
  const [migrateParaId, setMigrateParaId] = useState<number | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });
  
  // Form states
  const [newCategoria, setNewCategoria] = useState({ nome: '' });

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch (error) {
      showToast('Erro ao carregar categorias', 'danger');
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

  const handleCreateCategoria = async () => {
    if (!validateFields(newCategoria.nome)) {
      return;
    }

    try {
      const response = await createCategoria(newCategoria.nome);
      showToast(response.message, response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowCreateModal(false);
        setNewCategoria({ nome: '' });
        loadCategorias();
      }
    } catch (error) {
      showToast('Erro ao criar categoria', 'danger');
    }
  };

  const handleDeleteClick = (categoria: CategoriaGasto) => {
    setSelectedCategoria(categoria);
    
    if (categoria.expensesTypesCount > 0) {
      setShowMigrateAlert(true);
    } else {
      setShowDeleteAlert(true);
    }
  };

  const handleMigrate = () => {
    setShowMigrateAlert(false);
    setShowMigrateModal(true);
  };

  const handleConfirmMigrate = () => {
    if (!selectedCategoria || !migrateParaId) return;

    deleteCategoria(selectedCategoria.id, migrateParaId)
      .then(response => {
        showToast(response.message, response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowMigrateModal(false);
          setSelectedCategoria(null);
          setMigrateParaId(null);
          loadCategorias();
        }
      })
      .catch(() => {
        showToast('Erro ao migrar categoria', 'danger');
      });
  };

  const handleDeleteAll = () => {
    setShowMigrateAlert(false);
    setShowConfirmDeleteAlert(true);
  };

  const handleConfirmDeleteAll = () => {
    if (!selectedCategoria) return;

    deleteCategoria(selectedCategoria.id)
      .then(response => {
        showToast(response.message, response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowConfirmDeleteAlert(false);
          setSelectedCategoria(null);
          loadCategorias();
        }
      })
      .catch(() => {
        showToast('Erro ao excluir categoria', 'danger');
      });
  };

  const handleDeleteEmpty = () => {
    if (!selectedCategoria) return;

    deleteCategoria(selectedCategoria.id)
      .then(response => {
        showToast(response.message, response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedCategoria(null);
          loadCategorias();
        }
      })
      .catch(() => {
        showToast('Erro ao excluir categoria', 'danger');
      });
  };

  const handleEditCategoria = (categoria: CategoriaGasto) => {
    // Navegar para página de edição
    window.location.href = `/manager/gastos/${categoria.id}/editar`;
  };

  const handleDetalhes = (categoria: CategoriaGasto) => {
    // Navegar para página de detalhes
    window.location.href = `/manager/gastos/${categoria.id}/detalhes`;
  };

  const outrasCategorias = categorias.filter(cat => cat.id !== selectedCategoria?.id);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Gastos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px' }}>
          <IonButton 
            expand="block" 
            shape="round" 
            onClick={() => setShowCreateModal(true)}
            style={{ marginBottom: '16px' }}
          >
            <IonIcon slot="start" icon={add} />
            Adicionar nova categoria
          </IonButton>

          {categorias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Nenhuma categoria encontrada</p>
            </div>
          ) : (
            categorias.map((categoria) => (
            <IonCard 
              key={categoria.id} 
              style={{ 
                marginBottom: '16px',
                borderRadius: '12px'
              }}
            >
              <IonCardHeader>
                <IonCardTitle>{categoria.name}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="12">
                      <IonItem>
                        <IonLabel>
                          <h3>Tipos de gastos: {categoria.expensesTypesCount}</h3>
                        </IonLabel>
                      </IonItem>
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol size="3">
                      <IonButton
                        fill="clear"
                        onClick={() => handleEditCategoria(categoria)}
                      >
                        <IonIcon icon={create} />
                      </IonButton>
                    </IonCol>
                    <IonCol size="3">
                      <IonButton
                        fill="clear"
                        onClick={() => handleDetalhes(categoria)}
                      >
                        <IonIcon icon={eye} />
                      </IonButton>
                    </IonCol>
                    <IonCol size="3">
                      <IonButton
                        fill="clear"
                        color="danger"
                        onClick={() => handleDeleteClick(categoria)}
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

        {/* Modal Criar Categoria */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Nova Categoria de Gastos</IonTitle>
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
                  value={newCategoria.nome}
                  onIonInput={(e: any) => setNewCategoria({ nome: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleCreateCategoria}
                style={{ marginTop: '16px' }}
              >
                Criar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Migrar ou Excluir */}
        <IonAlert
          isOpen={showMigrateAlert}
          onDidDismiss={() => setShowMigrateAlert(false)}
          header="Confirmar"
          message={`Essa categoria de gastos possui ${selectedCategoria?.expensesTypesCount} tipos de gastos associados, deseja migrar para outra categoria ou apagá-los junto?`}
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Migrar',
              handler: handleMigrate
            },
            {
              text: 'Excluir tudo',
              role: 'destructive',
              handler: handleDeleteAll
            }
          ]}
        />

        {/* Modal Migrar */}
        <IonModal isOpen={showMigrateModal} onDidDismiss={() => setShowMigrateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Migrar Tipos de Gastos</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowMigrateModal(false)}>Cancelar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="stacked">Selecione a categoria para migrar:</IonLabel>
              </IonItem>
              {outrasCategorias.map((categoria) => (
                <IonItem 
                  key={categoria.id}
                  button 
                  onClick={() => setMigrateParaId(categoria.id)}
                  style={{ 
                    backgroundColor: migrateParaId === categoria.id ? '#e0e0e0' : 'transparent'
                  }}
                >
                  <IonLabel>{categoria.name}</IonLabel>
                </IonItem>
              ))}
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleConfirmMigrate}
                disabled={!migrateParaId}
                style={{ marginTop: '16px' }}
              >
                <IonIcon slot="start" icon={arrowForward} />
                Migrar
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Confirmar Excluir Tudo */}
        <IonAlert
          isOpen={showConfirmDeleteAlert}
          onDidDismiss={() => setShowConfirmDeleteAlert(false)}
          header="Confirmar Exclusão"
          message="Tem certeza que deseja excluir todos os tipos de gastos junto com a categoria?"
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Excluir tudo',
              role: 'destructive',
              handler: handleConfirmDeleteAll
            }
          ]}
        />

        {/* Alert Confirmar Excluir Vazio */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirmar Exclusão"
          message="Tem certeza que deseja excluir esta categoria?"
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Excluir',
              role: 'destructive',
              handler: handleDeleteEmpty
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

export default Gastos;
