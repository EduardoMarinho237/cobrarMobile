import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonModal,
  IonButtons,
  IonButton,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonRadioGroup,
  IonRadio,
  IonLabel,
  IonItem,
  IonSpinner
} from '@ionic/react';
import { addCircle, trash, create, arrowForward, close } from 'ionicons/icons';
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
import PrimaryButton from '../../components/ui/PrimaryButton';
import StyledInput from '../../components/ui/StyledInput';
import ActionButton from '../../components/ui/ActionButton';
import GreenHeader from '../../components/ui/GreenHeader';

const EditarCategoria: React.FC = () => {
  const { t } = useTranslation();
  const { categoriaId } = useParams<{ categoriaId: string }>();
  const history = useHistory();
  const [categoria, setCategoria] = useState<CategoriaGasto | null>(null);
  const [tipos, setTipos] = useState<TipoGasto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    setIsLoading(true);
    try {
      const categoriasResponse = await getCategorias();
      
      let categorias = categoriasResponse;
      if (categoriasResponse && typeof categoriasResponse === 'object' && 'success' in categoriasResponse && 'data' in categoriasResponse) {
        categorias = categoriasResponse.data;
      }
      
      const cat = Array.isArray(categorias) ? categorias.find((c: CategoriaGasto) => c.id === parseInt(categoriaId!)) : null;
      if (cat) {
        setCategoria(cat);
        setEditNome(cat.name);
      }
      
      await loadTipos();
    } catch (error) {
      console.error('Erro ao carregar categoria:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTipos = async () => {
    try {
      const response = await getTiposGastos(parseInt(categoriaId!));
      
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

    deleteTipoGasto(selectedTipo.id, migrateParaId)
      .then(response => {
        showToast(response.message || t('pages.expensesEdit.expenseTypeMigratedSuccess'), response.success ? 'success' : 'danger');
        
        setShowMigrateModal(false);
        setSelectedTipo(null);
        setMigrateParaId(null);
        loadTipos();
        
        if (response.success) {
          setTimeout(() => {
            const tiposRestantes = tipos.filter(tipo => tipo.id !== selectedTipo.id);
            if (tiposRestantes.length === 0) {
              window.location.href = '/manager/gastos';
            }
          }, 500);
        }
      })
      .catch((error) => {
        console.error('Erro ao migrar tipo de gasto:', error);
        showToast(t('pages.expensesEdit.connectionError'), 'danger');
        
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
    setShowDeleteAlert(true);
  };

  useEffect(() => {
    loadCategoria();
    loadTipos();
    
    const setupRefresher = () => {
      const refresher = document.getElementById('editarcategoria-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          await Promise.all([loadCategoria(), loadTipos()]);
          refresher.complete();
        });
      }
    };

    setTimeout(setupRefresher, 100);
  }, [categoriaId]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
          <IonTitle>{t('pages.expensesEdit.title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/manager/gastos')} style={{ color: '#fff' }}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="editarcategoria-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: '200px',
              gap: '16px'
            }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#999', fontSize: '14px' }}>{t('pages.expenses.loadingExpenses')}</p>
            </div>
          ) : (
            <>
              {/* Card da Categoria */}
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                marginBottom: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                overflow: 'hidden'
              }}>
                <div style={{
                  backgroundColor: '#0c0989',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                    {categoria?.name || t('pages.expensesEdit.title')}
                  </span>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <StyledInput
                    label={t('pages.expensesEdit.categoryName')}
                    placeholder={t('pages.expensesEdit.categoryNamePlaceholder')}
                    value={editNome || ''}
                    onIonInput={(e: any) => setEditNome(e.detail.value || '')}
                  />
                  <PrimaryButton
                    onClick={handleUpdateCategoria}
                    label={t('pages.expensesEdit.saveCategory')}
                  />
                </div>
              </div>

              {/* Tipos de Gastos */}
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#262626' }}>
                    {t('pages.expensesEdit.expenseTypes')}
                  </h3>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <PrimaryButton
                    onClick={() => setShowCreateModal(true)}
                    label={t('pages.expensesEdit.addNewType')}
                    icon={addCircle}
                    style={{ marginBottom: '16px' }}
                  />

                  {tipos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p style={{ color: '#999', margin: 0, fontSize: '14px' }}>{t('pages.expensesEdit.noTypesCreated')}</p>
                    </div>
                  ) : (
                    tipos.map((tipo) => (
                    <div key={tipo.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: '1px solid #f5f5f5'
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                        {tipo.name}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <ActionButton
                          icon={create}
                          label=""
                          onClick={() => openEditModal(tipo)}
                          backgroundColor="#f0f7ff"
                          color="#0066cc"
                        />
                        <ActionButton
                          icon={trash}
                          label=""
                          onClick={() => openDeleteAlert(tipo)}
                          backgroundColor="#fff0f0"
                          color="#dc3545"
                        />
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Criar Tipo */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <GreenHeader
            title={t('pages.expensesEdit.newExpenseType')}
            onClose={() => setShowCreateModal(false)}
          />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              <StyledInput
                label={t('pages.expensesEdit.typeName')}
                placeholder={t('pages.expensesEdit.typeNamePlaceholder')}
                value={newTipo.nome}
                onIonInput={(e: any) => setNewTipo({ ...newTipo, nome: e.detail.value! })}
              />
              <PrimaryButton
                onClick={handleCreateTipo}
                label={t('pages.expensesEdit.create')}
              />
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Tipo */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <GreenHeader
            title={t('pages.expensesEdit.editExpenseType')}
            onClose={() => setShowEditModal(false)}
          />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              <StyledInput
                label={t('pages.expensesEdit.typeName')}
                placeholder={t('pages.expensesEdit.typeNamePlaceholder')}
                value={editTipo.nome}
                onIonInput={(e: any) => setEditTipo({ ...editTipo, nome: e.detail.value! })}
              />
              <PrimaryButton
                onClick={handleUpdateTipo}
                label={t('pages.expensesEdit.save')}
              />
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
          <GreenHeader
            title={t('pages.expensesEdit.migrateExpenseType')}
            onClose={() => setShowMigrateModal(false)}
          />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              <div style={{
                backgroundColor: '#ffebee',
                border: '1px solid #f44336',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <p style={{ 
                  color: '#d32f2f', 
                  fontSize: '13px', 
                  margin: 0,
                  textAlign: 'center'
                }}>
                  <strong>{t('common.attention')}:</strong> {t('pages.expensesEdit.migrateWarning').replace('{categoryName}', categoria?.name || '')}
                </p>
              </div>

              <IonRadioGroup value={migrateParaId} onIonChange={(e: any) => setMigrateParaId(e.detail.value)}>
                {tipos.filter(tipo => tipo.id !== selectedTipo?.id).map((tipo) => (
                  <IonItem key={tipo.id} style={{ '--border-radius': '12px', marginBottom: '4px' }}>
                    <IonRadio value={tipo.id} slot="start" />
                    <IonLabel>{tipo.name}</IonLabel>
                  </IonItem>
                ))}
              </IonRadioGroup>

              <PrimaryButton
                onClick={handleConfirmMigrateTipo}
                label={t('pages.expensesEdit.migrate')}
                icon={arrowForward}
                disabled={!migrateParaId}
                style={{ marginTop: '16px' }}
              />
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
