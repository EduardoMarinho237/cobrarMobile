import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
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
  IonRadio,
  IonSpinner
} from '@ionic/react';
import { add, trash, create, eye, arrowForward, refresh } from 'ionicons/icons';
import { getCategorias, createCategoria, deleteCategoria, CategoriaGasto } from '../../services/gastoApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';

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
  
  // Form states

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
        
        // Fecha o modal e limpa os estados
        setShowMigrateModal(false);
        setSelectedCategoria(null);
        setMigrateParaId(null);
        
        // Força recarga completa da página para garantir renderização
        setTimeout(() => {
          window.location.reload();
        }, 200);
      })
      .catch((error) => {
        console.error('Erro ao migrar categoria:', error);
        showToast('Erro ao migrar categoria', 'danger');
        
        // Mesmo com erro, fecha o modal e limpa os estados
        setShowMigrateModal(false);
        setSelectedCategoria(null);
        setMigrateParaId(null);
        
        // Força recarga mesmo com erro
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
    history.push(`/manager/gastos/${categoria.id}/editar`);
  };

  const handleDetalhes = (categoria: CategoriaGasto) => {
    // Navegar para página de detalhes sem mostrar toast
    history.push(`/manager/gastos/${categoria.id}/detalhes`);
  };

  const outrasCategorias = categorias.filter(cat => cat.id !== selectedCategoria?.id);

  useEffect(() => {
    loadCategorias();
    
    // Configurar o refresher
    const setupRefresher = () => {
      const refresher = document.getElementById('gastos-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          await loadCategorias();
          refresher.complete();
        });
      }
    };

    // Usar setTimeout para garantir que o DOM esteja pronto
    setTimeout(setupRefresher, 100);
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.expenses.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="gastos-refresher">
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{ padding: '16px' }}>
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
              <p style={{ color: '#666', fontSize: '14px' }}>{t('pages.expenses.loadingExpenses')}</p>
            </div>
          ) : (
            <>
              <IonButton 
                expand="block" 
                shape="round" 
                onClick={() => setShowCreateModal(true)}
                style={{ marginBottom: '16px' }}
              >
                <IonIcon slot="start" icon={add} />
                {t('pages.expenses.addCategory')}
              </IonButton>

              {categorias.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>{t('pages.expenses.noCategoriesFound')}</p>
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
                              <h3>{t('pages.expenses.expenseTypes')} {categoria.expensesTypesCount}</h3>
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
            </>
          )}
        </div>

        {/* Modal Criar Categoria */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.expenses.addCategory')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonInput
                  label={t('pages.expenses.name')}
                  labelPlacement="floating"
                  placeholder={t('pages.expenses.namePlaceholder')}
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
                {t('pages.expenses.save')}
              </IonButton>
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
              <IonTitle>{t('pages.expenses.migrate')} {t('pages.expenses.title')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowMigrateModal(false)}>{t('common.cancel')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel>
                  <h2>{t('pages.expenses.migrate')} {selectedCategoria?.expensesTypesCount || 0} {t('pages.expenses.title')} {t('pages.expenses.title')} {selectedCategoria?.name}</h2>
                </IonLabel>
              </IonItem>
              
              <div style={{ 
                padding: '12px', 
                margin: '16px 0', 
                backgroundColor: '#fee', 
                border: '1px solid #fcc', 
                borderRadius: '8px',
                color: '#c00'
              }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>{t('common.attention')}:</strong> {t('pages.expenses.migrateWarning').replace('{categoryName}', selectedCategoria?.name || '')}
                </p>
              </div>
              
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
                {t('pages.expenses.migrate')}
              </IonButton>
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
