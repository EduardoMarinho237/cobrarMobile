import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
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
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonRadioGroup,
  IonRadio
} from '@ionic/react';
import { add, trash, create, arrowBack, refresh } from 'ionicons/icons';
import { 
  getCategorias, 
  updateCategoria, 
  getTiposGastos, 
  createTipoGasto, 
  updateTipoGasto, 
  deleteTipoGasto,
  migrateGastos,
  CategoriaGasto,
  TipoGasto 
} from '../../services/gastoApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';

const EditarCategoria: React.FC = () => {
  const { t } = useTranslation();
  const { categoriaId } = useParams<{ categoriaId: string }>();
  const history = useHistory();
  const [categoria, setCategoria] = useState<CategoriaGasto | null>(null);
  const [tipos, setTipos] = useState<TipoGasto[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoGasto | null>(null);
  const [migrateParaId, setMigrateParaId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');
  const [newTipo, setNewTipo] = useState({ nome: '' });
  const [editTipo, setEditTipo] = useState({ nome: '' });
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  useEffect(() => {
    if (categoriaId) {
      loadCategoria();
    }
  }, [categoriaId]);

  const loadCategoria = async () => {
    try {
      // Carrega apenas o nome da categoria para edição
      const categoriasResponse = await getCategorias();
      
      // Trata a resposta da API que pode ter estrutura {success, data}
      let categorias = categoriasResponse;
      if (categoriasResponse && typeof categoriasResponse === 'object' && 'success' in categoriasResponse && 'data' in categoriasResponse) {
        categorias = categoriasResponse.data;
      }
      
      const cat = Array.isArray(categorias) ? categorias.find((c: CategoriaGasto) => c.id === parseInt(categoriaId!)) : null;
      if (cat) {
        setCategoria(cat);
        setEditNome(cat.name);
      }
      
      // Carrega os tipos da categoria
      await loadTipos();
    } catch (error) {
      console.error('Erro ao carregar categoria:', error);
      // Removido toast instantâneo ao carregar página
    }
  };

  const loadTipos = async () => {
    try {
      const response = await getTiposGastos(parseInt(categoriaId!));
      
      // Se a resposta tiver a estrutura { success, data }, extrai os dados
      let data = response;
      if (response && typeof response === 'object' && 'success' in response && response.success && 'data' in response) {
        data = response.data;
      }
      
      setTipos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar tipos de gastos:', error);
      showToast(t('pages.expensesEdit.errorLoadingExpenseTypes'), 'danger');
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const validateFields = (nome: string) => {
    if (!nome.trim()) {
      showToast(t('pages.expensesEdit.nameRequired'), 'danger');
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
      
      // Usa a mensagem da API
      showToast(response.message || t('pages.expensesEdit.categoryUpdatedSuccess'), response.success ? 'success' : 'danger');
      
      if (response.success) {
        loadCategoria();
      }
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      showToast(t('pages.expensesEdit.connectionError'), 'danger');
    }
  };

  const handleCreateTipo = async () => {
    if (!validateFields(newTipo.nome)) {
      return;
    }

    try {
      const response = await createTipoGasto(newTipo.nome, parseInt(categoriaId!));
      
      // Usa a mensagem da API
      showToast(response.message || t('pages.expensesEdit.expenseTypeCreatedSuccess'), response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowCreateModal(false);
        setNewTipo({ nome: '' });
        loadTipos();
      }
    } catch (error) {
      console.error('Erro ao criar tipo de gasto:', error);
      showToast(t('pages.expensesEdit.connectionError'), 'danger');
    }
  };

  const handleUpdateTipo = async () => {
    if (!validateFields(editTipo.nome) || !selectedTipo) {
      return;
    }

    try {
      const response = await updateTipoGasto(selectedTipo.id, editTipo.nome, parseInt(categoriaId!));
      
      // Usa a mensagem da API
      showToast(response.message || t('pages.expensesEdit.expenseTypeUpdatedSuccess'), response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowEditModal(false);
        setEditTipo({ nome: '' });
        setSelectedTipo(null);
        loadTipos();
      }
    } catch (error) {
      console.error('Erro ao atualizar tipo de gasto:', error);
      showToast(t('pages.expensesEdit.connectionError'), 'danger');
    }
  };

  const handleDeleteTipo = () => {
    if (!selectedTipo) return;

    deleteTipoGasto(selectedTipo.id)
      .then(response => {
        // Usa a mensagem da API
        showToast(response.message || t('pages.expensesEdit.expenseTypeDeletedSuccess'), response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedTipo(null);
          loadTipos();
        }
      })
      .catch((error) => {
        console.error('Erro ao excluir tipo de gasto:', error);
        showToast(t('pages.expensesEdit.connectionError'), 'danger');
        loadTipos();
      });
  };

  const handleMigrateTipo = () => {
    setShowDeleteAlert(false);
    setShowMigrateModal(true);
  };

  const handleConfirmMigrateTipo = () => {
    if (!selectedTipo || !migrateParaId) return;

    console.log('Iniciando migração de tipo:', { 
      sourceId: selectedTipo.id, 
      targetId: migrateParaId,
      sourceName: selectedTipo.name
    });

    deleteTipoGasto(selectedTipo.id, migrateParaId)
      .then(response => {
        console.log('Resposta da migração de tipo:', response);
        
        // Usa a mensagem da API
        showToast(response.message || t('pages.expensesEdit.expenseTypeMigratedSuccess'), response.success ? 'success' : 'danger');
        
        // Sempre volta para a listagem, mesmo com erro
        setShowMigrateModal(false);
        setSelectedTipo(null);
        setMigrateParaId(null);
        loadTipos();
        
        // Se a migração for bem-sucedida e não houver mais tipos, volta para a listagem de categorias
        if (response.success) {
          // Usa setTimeout para garantir que o estado foi atualizado
          setTimeout(() => {
            const tiposRestantes = tipos.filter(tipo => tipo.id !== selectedTipo.id);
            console.log('Tipos restantes após migração:', tiposRestantes.length);
            if (tiposRestantes.length === 0) {
              // Não há mais tipos, volta para a listagem de categorias
              console.log('Voltando para listagem de categorias...');
              window.location.href = '/manager/gastos';
            }
          }, 500); // Pequeno delay para garantir atualização do estado
        }
      })
      .catch((error) => {
        console.error('Erro ao migrar tipo de gasto:', error);
        showToast(t('pages.expensesEdit.connectionError'), 'danger');
        
        // Mesmo com erro, volta para a listagem
        setShowMigrateModal(false);
        setSelectedTipo(null);
        setMigrateParaId(null);
        loadTipos();
      });
  };

  const openEditModal = (tipo: TipoGasto) => {
    setSelectedTipo(tipo);
    setEditTipo({ nome: tipo.name });
    setShowEditModal(true);
  };

  const openDeleteAlert = (tipo: TipoGasto) => {
    setSelectedTipo(tipo);
    // Simulando que sempre há gastos para mostrar a opção de migrar
    // Em um caso real, você verificaria se há gastos associados
    setShowDeleteAlert(true);
  };

  useEffect(() => {
    loadCategoria();
    loadTipos();
    
    // Configurar o refresher
    const setupRefresher = () => {
      const refresher = document.getElementById('editarcategoria-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          await Promise.all([loadCategoria(), loadTipos()]);
          refresher.complete();
        });
      }
    };

    // Usar setTimeout para garantir que o DOM esteja pronto
    setTimeout(setupRefresher, 100);
  }, [categoriaId]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/manager/gastos" icon={arrowBack} text={t('common.back')} />
          </IonButtons>
          <IonTitle>{t('pages.expensesEdit.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="editarcategoria-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px' }}>
          {/* Card da Categoria */}
          <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>{categoria?.name || t('pages.expensesEdit.title')}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonInput
                  label={t('pages.expensesEdit.categoryName')}
                  labelPlacement="floating"
                  placeholder={t('pages.expensesEdit.categoryNamePlaceholder')}
                  value={editNome || ''}
                  onIonInput={(e: any) => {
                    setEditNome(e.detail.value || '');
                  }}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleUpdateCategoria}
                style={{ marginTop: '16px' }}
              >
                {t('pages.expensesEdit.saveCategory')}
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Tipos de Gastos */}
          <IonCard style={{ borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>{t('pages.expensesEdit.expenseTypes')}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonButton 
                expand="block" 
                shape="round" 
                onClick={() => setShowCreateModal(true)}
                style={{ marginBottom: '16px' }}
              >
                <IonIcon slot="start" icon={add} />
                {t('pages.expensesEdit.addNewType')}
              </IonButton>

              {tipos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>{t('pages.expensesEdit.noTypesCreated')}</p>
                </div>
              ) : (
                tipos.map((tipo) => (
                <IonItem key={tipo.id} style={{ marginBottom: '8px' }}>
                  <IonLabel>
                    <h3>{tipo.name}</h3>
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
              )))}
            </IonCardContent>
          </IonCard>
        </div>

        {/* Modal Criar Tipo */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.expensesEdit.newExpenseType')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonInput
                  label={t('pages.expensesEdit.typeName')}
                  labelPlacement="floating"
                  placeholder={t('pages.expensesEdit.typeNamePlaceholder')}
                  value={newTipo.nome}
                  onIonInput={(e: any) => setNewTipo({ ...newTipo, nome: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleCreateTipo}
                style={{ marginTop: '16px' }}
              >
                {t('pages.expensesEdit.create')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Tipo */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.expensesEdit.editExpenseType')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonInput
                  label={t('pages.expensesEdit.typeName')}
                  labelPlacement="floating"
                  placeholder={t('pages.expensesEdit.typeNamePlaceholder')}
                  value={editTipo.nome}
                  onIonInput={(e: any) => setEditTipo({ ...editTipo, nome: e.detail.value! })}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleUpdateTipo}
                style={{ marginTop: '16px' }}
              >
                {t('pages.expensesEdit.save')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Excluir Tipo */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={t('pages.expensesEdit.confirmDelete')}
          message={t('pages.expensesEdit.confirmDeleteMessage').replace('{typeName}', selectedTipo?.name || '')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('pages.expensesEdit.migrate'),
              handler: handleMigrateTipo
            },
            {
              text: t('pages.expensesEdit.deleteAll'),
              role: 'destructive',
              handler: handleDeleteTipo
            }
          ]}
        />

        {/* Modal Migrar Tipo */}
        <IonModal isOpen={showMigrateModal} onDidDismiss={() => setShowMigrateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.expensesEdit.migrateExpenseType')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowMigrateModal(false)}>{t('common.cancel')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel>
                  <h2>{t('pages.expensesEdit.chooseTypeToMigrate').replace('{typeName}', selectedTipo?.name || '')}</h2>
                </IonLabel>
              </IonItem>
              
              {/* Aviso sobre exclusão da categoria */}
              <div style={{ 
                backgroundColor: '#ffebee', 
                border: '1px solid #f44336', 
                borderRadius: '8px', 
                padding: '12px', 
                marginBottom: '16px' 
              }}>
                <p style={{ 
                  color: '#d32f2f', 
                  fontSize: '14px', 
                  margin: '0',
                  textAlign: 'center'
                }}>
                  <strong>{t('common.attention')}:</strong> {t('pages.expensesEdit.migrateWarning').replace('{categoryName}', categoria?.name || '')}
                </p>
              </div>
              
              <IonRadioGroup value={migrateParaId} onIonChange={(e: any) => setMigrateParaId(e.detail.value)}>
                {tipos.filter(tipo => tipo.id !== selectedTipo?.id).map((tipo) => (
                  <IonItem key={tipo.id}>
                    <IonRadio value={tipo.id} slot="start" />
                    <IonLabel>{tipo.name}</IonLabel>
                  </IonItem>
                ))}
              </IonRadioGroup>
              
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleConfirmMigrateTipo}
                disabled={!migrateParaId}
                style={{ marginTop: '16px' }}
              >
                <IonIcon slot="start" icon={add} />
                {t('pages.expensesEdit.migrate')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

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
