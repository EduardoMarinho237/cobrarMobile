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
  IonCol,
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/react';
import { add, trash, create, eye, wallet, refresh } from 'ionicons/icons';
import { formatCurrencyWithSymbol } from '../../utils/currency';
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
import { useTranslation } from 'react-i18next';

const GastosRoute: React.FC = () => {
  const { t } = useTranslation();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [totalGastos, setTotalGastos] = useState(0);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [tipos, setTipos] = useState<TipoGasto[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<Gasto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadGastos(),
        loadCategorias()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGastos = async () => {
    try {
      const [gastosData, totalData] = await Promise.all([
        getGastosDoDia(),
        getTotalGastosDia()
      ]);
      setGastos(gastosData);
      setTotalGastos(totalData.total);
    } catch (error) {
      showToast(t('pages.expensesRoute.errorLoadingExpenses'), 'danger');
    }
  };

  const loadCategorias = async () => {
    try {
      const data = await getCategorias();
      setCategorias(data);
    } catch (error) {
      showToast(t('pages.expensesRoute.errorLoadingCategories'), 'danger');
    }
  };

  const loadTipos = async (categoriaId: number) => {
    try {
      const data = await getTiposGastos(categoriaId);
      setTipos(data);
    } catch (error) {
      showToast(t('pages.expensesRoute.errorLoadingTypes'), 'danger');
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const validateFields = (gasto: GastoForm) => {
    if (!gasto.categoriaId) {
      showToast(t('pages.expensesRoute.selectCategory'), 'danger');
      return false;
    }
    
    if (!gasto.tipoId) {
      showToast(t('pages.expensesRoute.selectType'), 'danger');
      return false;
    }
    
    if (!gasto.valor || gasto.valor <= 0) {
      showToast(t('pages.expensesRoute.validValue'), 'danger');
      return false;
    }
    
    if (!gasto.descricao.trim()) {
      showToast(t('pages.expensesRoute.descriptionRequired'), 'danger');
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
      showToast(t('pages.expensesRoute.errorCreatingExpense'), 'danger');
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
      showToast(t('pages.expensesRoute.errorUpdatingExpense'), 'danger');
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
        showToast(t('pages.expensesRoute.errorDeletingExpense'), 'danger');
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

  useEffect(() => {
    loadData();
    
    // Configurar o refresher
    const setupRefresher = () => {
      const refresher = document.getElementById('gastosroute-refresher') as HTMLIonRefresherElement;
      if (refresher) {
        refresher.addEventListener('ionRefresh', async () => {
          await loadData();
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
          <IonTitle>{t('pages.expensesRoute.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="gastosroute-refresher">
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
              <p style={{ color: '#666', fontSize: '14px' }}>{t('pages.expensesRoute.loadingExpenses')}</p>
            </div>
          ) : (
            <>
              {/* Card de Total do Dia */}
              <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={wallet} style={{ marginRight: '8px' }} />
                    {t('pages.expensesRoute.dailyExpenses')}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <h2 style={{ textAlign: 'center', color: '#dc3545', margin: '0' }}>
                    {formatCurrencyWithSymbol(totalGastos)}
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
                {t('pages.expensesRoute.addExpense')}
              </IonButton>

              {/* Lista de Gastos */}
              {gastos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>{t('pages.expensesRoute.noExpensesCreated')}</p>
                </div>
              ) : (
                gastos.map((gasto) => (
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
                                <h3>{t('pages.expensesRoute.value')}: {formatCurrencyWithSymbol(gasto.valor)}</h3>
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
                ))
              )}
            </>
          )}
        </div>

        {/* Modal Criar Gasto */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.expensesRoute.newExpense')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="stacked">{t('pages.expensesRoute.category')}</IonLabel>
                <IonSelect
                  value={newGasto.categoriaId}
                  onIonChange={(e: any) => handleCategoriaChange(e.detail.value)}
                >
                  <IonSelectOption value={0}>{t('pages.expensesRoute.select')}</IonSelectOption>
                  {categorias.map((categoria) => (
                    <IonSelectOption key={categoria.id} value={categoria.id}>
                      {categoria.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">{t('pages.expensesRoute.type')}</IonLabel>
                <IonSelect
                  value={newGasto.tipoId}
                  onIonChange={(e: any) => setNewGasto({ ...newGasto, tipoId: e.detail.value })}
                  disabled={newGasto.categoriaId === 0}
                >
                  <IonSelectOption value={0}>{t('pages.expensesRoute.select')}</IonSelectOption>
                  {tipos.map((tipo) => (
                    <IonSelectOption key={tipo.id} value={tipo.id}>
                      {tipo.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonInput
                  label={t('pages.expensesRoute.value')}
                  labelPlacement="floating"
                  placeholder={t('pages.expensesRoute.enterValue')}
                  type="number"
                  value={newGasto.valor}
                  onIonInput={(e: any) => setNewGasto({ ...newGasto, valor: e.detail.value! })}
                />
              </IonItem>
              
              <IonItem>
                <IonInput
                  label={t('pages.expensesRoute.description')}
                  labelPlacement="floating"
                  placeholder={t('pages.expensesRoute.enterDescription')}
                  value={newGasto.descricao}
                  onIonInput={(e: any) => setNewGasto({ ...newGasto, descricao: e.detail.value! })}
                />
              </IonItem>
              
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleCreateGasto}
                style={{ marginTop: '16px' }}
              >
                {t('pages.expensesRoute.create')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Gasto */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.expensesRoute.editExpense')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="stacked">{t('pages.expensesRoute.category')}</IonLabel>
                <IonSelect
                  value={editGasto.categoriaId}
                  onIonChange={(e: any) => handleCategoriaChange(e.detail.value, true)}
                >
                  <IonSelectOption value={0}>{t('pages.expensesRoute.select')}</IonSelectOption>
                  {categorias.map((categoria) => (
                    <IonSelectOption key={categoria.id} value={categoria.id}>
                      {categoria.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">{t('pages.expensesRoute.type')}</IonLabel>
                <IonSelect
                  value={editGasto.tipoId}
                  onIonChange={(e: any) => setEditGasto({ ...editGasto, tipoId: e.detail.value })}
                  disabled={editGasto.categoriaId === 0}
                >
                  <IonSelectOption value={0}>{t('pages.expensesRoute.select')}</IonSelectOption>
                  {tipos.map((tipo) => (
                    <IonSelectOption key={tipo.id} value={tipo.id}>
                      {tipo.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonInput
                  label={t('pages.expensesRoute.value')}
                  labelPlacement="floating"
                  placeholder={t('pages.expensesRoute.enterValue')}
                  type="number"
                  value={editGasto.valor}
                  onIonInput={(e: any) => setEditGasto({ ...editGasto, valor: e.detail.value! })}
                />
              </IonItem>
              
              <IonItem>
                <IonInput
                  label={t('pages.expensesRoute.description')}
                  labelPlacement="floating"
                  placeholder={t('pages.expensesRoute.enterDescription')}
                  value={editGasto.descricao}
                  onIonInput={(e: any) => setEditGasto({ ...editGasto, descricao: e.detail.value! })}
                />
              </IonItem>
              
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleUpdateGasto}
                style={{ marginTop: '16px' }}
              >
                {t('pages.expensesRoute.save')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Ver Gasto */}
        <IonModal isOpen={showViewModal} onDidDismiss={() => setShowViewModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.expensesRoute.expenseDetails')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowViewModal(false)}>{t('common.close')}</IonButton>
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
                        <h3>{t('pages.expensesRoute.value')}</h3>
                        <p>{formatCurrencyWithSymbol(selectedGasto.valor)}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>{t('pages.expensesRoute.description')}</h3>
                        <p>{selectedGasto.descricao}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>{t('pages.expensesRoute.date')}</h3>
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
          header={t('pages.expensesRoute.confirmDelete')}
          message={t('pages.expensesRoute.confirmDeleteMessage').replace('{expenseDescription}', selectedGasto?.descricao || '')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('pages.expensesRoute.delete'),
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
