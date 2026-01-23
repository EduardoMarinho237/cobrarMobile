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
  IonCol,
  IonRefresher,
  IonRefresherContent,
  IonRadioGroup,
  IonRadio
} from '@ionic/react';
import { add, trash, create, eye, arrowForward, refresh } from 'ionicons/icons';
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
      const response = await getCategorias();
      console.log('Resposta da API getCategorias:', response);
      
      // Se a resposta tiver a estrutura { success, data }, extrai os dados
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = response.data;
      }
      
      setCategorias(Array.isArray(data) ? data : []);
      console.log('Categorias carregadas:', data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
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
    
    return true;
  };

  const handleCreateCategoria = async () => {
    if (!validateFields(newCategoria.nome)) {
      return;
    }

    try {
      const response = await createCategoria(newCategoria.nome);
      
      // Usa a mensagem da API
      showToast(response.message || 'Categoria criada com sucesso', response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowCreateModal(false);
        setNewCategoria({ nome: '' });
        loadCategorias();
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      showToast('Erro de conexão, tente novamente', 'danger');
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

    console.log('Iniciando migração:', { 
      sourceId: selectedCategoria.id, 
      targetId: migrateParaId,
      sourceName: selectedCategoria.name,
      typesCount: selectedCategoria.expensesTypesCount
    });

    deleteCategoria(selectedCategoria.id, migrateParaId)
      .then(response => {
        console.log('Resposta da migração:', response);
        showToast(response.message, response.success ? 'success' : 'danger');
        
        // Sempre volta para a listagem, mesmo com erro
        setShowMigrateModal(false);
        setSelectedCategoria(null);
        setMigrateParaId(null);
        loadCategorias();
      })
      .catch((error) => {
        console.error('Erro ao migrar categoria:', error);
        showToast('Erro ao migrar categoria', 'danger');
        
        // Mesmo com erro, volta para a listagem
        setShowMigrateModal(false);
        setSelectedCategoria(null);
        setMigrateParaId(null);
        loadCategorias();
      });
  };

  const handleDeleteAll = () => {
    setShowMigrateAlert(false);
    setShowConfirmDeleteAlert(true);
  };

  const handleConfirmDeleteAll = () => {
    if (!selectedCategoria) return;

    console.log('Excluindo categoria com tipos:', selectedCategoria.id);
    
    deleteCategoria(selectedCategoria.id)
      .then(response => {
        console.log('Resposta da exclusão:', response);
        
        // Usa a mensagem da API
        showToast(response.message || 'Categoria excluída com sucesso', response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowConfirmDeleteAlert(false);
          setSelectedCategoria(null);
          loadCategorias();
        }
      })
      .catch((error) => {
        console.error('Erro ao excluir categoria:', error);
        showToast('Erro de conexão, tente novamente', 'danger');
      });
  };

  const handleDeleteEmpty = () => {
    if (!selectedCategoria) return;

    console.log('Excluindo categoria vazia:', selectedCategoria.id);

    deleteCategoria(selectedCategoria.id)
      .then(response => {
        console.log('Resposta da exclusão:', response);
        
        // Usa a mensagem da API
        showToast(response.message || 'Categoria excluída com sucesso', response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedCategoria(null);
          loadCategorias();
        }
      })
      .catch((error) => {
        console.error('Erro ao excluir categoria:', error);
        showToast('Erro de conexão, tente novamente', 'danger');
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

  const handleRefresh = async (event: CustomEvent) => {
    await loadCategorias();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Gastos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refresh}
            pullingText="Puxe para atualizar"
            refreshingSpinner="circles"
            refreshingText="Atualizando..."
          />
        </IonRefresher>
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
                <IonInput
                  label="Nome da Categoria"
                  labelPlacement="floating"
                  placeholder="Digite o nome da categoria"
                  value={newCategoria.nome}
                  onIonInput={(e: any) => setNewCategoria({ ...newCategoria, nome: e.detail.value! })}
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
                <IonLabel>
                  <h2>Escolha uma categoria para migrar todos os {selectedCategoria?.expensesTypesCount || 0} tipos de gastos pertencentes a {selectedCategoria?.name}</h2>
                </IonLabel>
              </IonItem>
              
              <IonRadioGroup value={migrateParaId} onIonChange={(e: any) => setMigrateParaId(e.detail.value)}>
                {outrasCategorias.map((categoria) => (
                  <IonItem key={categoria.id}>
                    <IonRadio value={categoria.id} slot="start" />
                    <IonLabel>{categoria.name}</IonLabel>
                  </IonItem>
                ))}
              </IonRadioGroup>
              
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
