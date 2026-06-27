import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
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
import { addCircle, trash, create, arrowForward } from 'ionicons/icons';
import { getCategorias, createCategoria, deleteCategoria, CategoriaGasto } from '../../services/gastoApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import PrimaryButton from '../../components/ui/PrimaryButton';
import StyledInput from '../../components/ui/StyledInput';
import ActionButton from '../../components/ui/ActionButton';
import GreenHeader from '../../components/ui/GreenHeader';
import InfoRow from '../../components/ui/InfoRow';

const Gastos: React.FC = () => {
  const { t } = useTranslation();
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showMigrateAlert, setShowMigrateAlert] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [showConfirmDeleteAlert, setShowConfirmDeleteAlert] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaGasto | null>(null);
  const [migrateParaId, setMigrateParaId] = useState<number | null>(null);
  const [newCategoria, setNewCategoria] = useState({ nome: '' });
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    setIsLoading(true);
    try {
      const response = await getCategorias();
      
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = response.data;
      }
      
      setCategorias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      showToast(t('pages.expenses.errorLoadingCategories'), 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const validateFields = (nome: string) => {
    if (!nome.trim()) {
      showToast(t('pages.expenses.nameRequired'), 'danger');
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
      
      showToast(response.message || t('pages.expenses.categoryCreatedSuccess'), response.success ? 'success' : 'danger');
      
      if (response.success) {
        setShowCreateModal(false);
        setNewCategoria({ nome: '' });
        loadCategorias();
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      showToast(t('pages.expenses.connectionError'), 'danger');
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
        
        setShowMigrateModal(false);
        setSelectedCategoria(null);
        setMigrateParaId(null);
        
        setTimeout(() => {
          window.location.reload();
        }, 200);
      })
      .catch((error) => {
        console.error('Erro ao migrar categoria:', error);
        showToast(t('pages.expenses.errorMigratingCategory'), 'danger');
        
        setShowMigrateModal(false);
        setSelectedCategoria(null);
        setMigrateParaId(null);
        
        setTimeout(() => {
          window.location.reload();
        }, 200);
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
        showToast(response.message || t('pages.expenses.categoryDeletedSuccess'), response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowConfirmDeleteAlert(false);
          setSelectedCategoria(null);
          loadCategorias();
        }
      })
      .catch((error) => {
        console.error('Erro ao excluir categoria:', error);
        showToast(t('pages.expenses.connectionError'), 'danger');
      });
  };

  const handleDeleteEmpty = () => {
    if (!selectedCategoria) return;

    deleteCategoria(selectedCategoria.id)
      .then(response => {
        showToast(response.message || t('pages.expenses.categoryDeletedSuccess'), response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedCategoria(null);
          loadCategorias();
        }
      })
      .catch((error) => {
        console.error('Erro ao excluir categoria:', error);
        showToast(t('pages.expenses.connectionError'), 'danger');
      });
  };

  const handleEditCategoria = (categoria: CategoriaGasto) => {
    history.push(`/manager/gastos/${categoria.id}/editar`);
  };

  const outrasCategorias = categorias.filter(cat => cat.id !== selectedCategoria?.id);

  useEffect(() => {
    loadCategorias();
    
    const setupRefresher = () => {
      const refresher = document.getElementById('gastos-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          await loadCategorias();
          refresher.complete();
        });
      }
    };

    setTimeout(setupRefresher, 100);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#0c0989', '--color': '#fff' }}>
          <IonTitle>{t('pages.expenses.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="gastos-refresher">
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
              <PrimaryButton
                onClick={() => setShowCreateModal(true)}
                label={t('pages.expenses.addCategory')}
                icon={addCircle}
              />

              {categorias.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  marginTop: '8px'
                }}>
                  <p style={{ color: '#999', margin: 0, fontSize: '15px' }}>{t('pages.expenses.noCategoriesFound')}</p>
                </div>
              ) : (
                categorias.map((categoria) => (
                <div
                  key={categoria.id}
                  style={{ 
                    marginBottom: '16px',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: '#0c0989',
                    borderRadius: '16px 0 0 16px'
                  }} />
                  
                  <div style={{ paddingLeft: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#262626' }}>
                        {categoria.name}
                      </h2>
                    </div>

                    <InfoRow
                      label={t('pages.expenses.expenseTypes')}
                      value={categoria.expensesTypesCount?.toString() || '0'}
                    />

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '14px',
                      flexWrap: 'wrap'
                    }}>
                      <ActionButton
                        icon={create}
                        label={t('common.edit')}
                        onClick={() => handleEditCategoria(categoria)}
                        backgroundColor="#f0f7ff"
                        color="#0066cc"
                      />
                      <ActionButton
                        icon={trash}
                        label={t('common.delete')}
                        onClick={() => handleDeleteClick(categoria)}
                        backgroundColor="#fff0f0"
                        color="#dc3545"
                      />
                    </div>
                  </div>
                </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Modal Criar Categoria */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <GreenHeader
            title={t('pages.expenses.addCategory')}
            onClose={() => setShowCreateModal(false)}
            
          />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              <StyledInput
                label={t('pages.expenses.name')}
                placeholder={t('pages.expenses.namePlaceholder')}
                value={newCategoria.nome}
                onIonInput={(e: any) => setNewCategoria({ ...newCategoria, nome: e.detail.value! })}
              />
              <PrimaryButton
                onClick={handleCreateCategoria}
                label={t('pages.expenses.save')}
              />
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Migrar ou Excluir */}
        <IonAlert
          isOpen={showMigrateAlert}
          onDidDismiss={() => setShowMigrateAlert(false)}
          header={t('common.confirm')}
          message={t('pages.expenses.confirmMigrateMessage').replace('{count}', selectedCategoria?.expensesTypesCount?.toString() || '0')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('pages.expenses.migrate'),
              handler: handleMigrate
            },
            {
              text: t('pages.expenses.deleteAll'),
              role: 'destructive',
              handler: handleDeleteAll
            }
          ]}
        />

        {/* Modal Migrar */}
        <IonModal isOpen={showMigrateModal} onDidDismiss={() => setShowMigrateModal(false)}>
          <GreenHeader
            title={`${t('pages.expenses.migrate')} ${t('pages.expenses.title')}`}
            onClose={() => setShowMigrateModal(false)}
            
          />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              <div style={{
                padding: '12px',
                margin: '0 0 16px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c00'
              }}>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  <strong>{t('common.attention')}:</strong> {t('pages.expenses.migrateWarning').replace('{categoryName}', selectedCategoria?.name || '')}
                </p>
              </div>

              <IonRadioGroup value={migrateParaId} onIonChange={(e: any) => setMigrateParaId(e.detail.value)}>
                {outrasCategorias.map((categoria) => (
                  <IonItem key={categoria.id} style={{ '--border-radius': '12px', marginBottom: '4px' }}>
                    <IonRadio value={categoria.id} slot="start" />
                    <IonLabel>{categoria.name}</IonLabel>
                  </IonItem>
                ))}
              </IonRadioGroup>

              <PrimaryButton
                onClick={handleConfirmMigrate}
                label={t('pages.expenses.migrate')}
                icon={arrowForward}
                disabled={!migrateParaId}
                style={{ marginTop: '16px' }}
              />
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Confirmar Excluir Tudo */}
        <IonAlert
          isOpen={showConfirmDeleteAlert}
          onDidDismiss={() => setShowConfirmDeleteAlert(false)}
          header={t('pages.expenses.confirmDeleteCategory')}
          message={t('pages.expenses.confirmDeleteCategoryMessage')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('pages.expenses.deleteAll'),
              role: 'destructive',
              handler: handleConfirmDeleteAll
            }
          ]}
        />

        {/* Alert Confirmar Excluir Vazio */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={t('pages.expenses.confirmDeleteCategory')}
          message={t('pages.expenses.confirmDeleteCategoryMessage')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('common.delete'),
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
