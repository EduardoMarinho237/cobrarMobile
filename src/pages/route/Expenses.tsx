import React, { useState, useEffect, useCallback } from 'react';
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
  IonSpinner
} from '@ionic/react';
import { add, trash, create, eye, wallet, refresh } from 'ionicons/icons';
import { formatCurrencyWithSymbol } from '../../utils/currency';
import { formatToBrazilTime } from '../../utils/dateFormat';
import { 
  Expense, 
  CreateExpenseRequest, 
  UpdateExpenseRequest,
  getExpensesPaginated, 
  createExpense, 
  updateExpense, 
  deleteExpense 
} from '../../services/expenseApi';
import { getExpenseCategories, getExpenseTypes, ExpenseCategory, ExpenseType } from '../../services/expenseApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useInView } from 'react-intersection-observer';

const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [types, setTypes] = useState<ExpenseType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  const {
    items: expenses,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteScroll<Expense>({
    fetchPage: async (page, size) => {
      const response = await getExpensesPaginated(page, size);
      return {
        content: response.content,
        last: response.last,
        totalElements: response.totalElements,
      };
    },
    pageSize: 30,
  });

  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasMore && !isLoading && !isLoadingMore) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, isLoadingMore, loadMore]);

  // Form states
  const [newExpense, setNewExpense] = useState<CreateExpenseRequest>({ 
    value: 0,
    expenseTypeId: 0,
    description: ''
  });
  const [editExpense, setEditExpense] = useState<UpdateExpenseRequest>({ 
    value: 0,
    expenseTypeId: 0,
    description: ''
  });

  // States para selects aninhados
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [editSelectedCategory, setEditSelectedCategory] = useState<number>(0);

  // Keys para forçar remontagem dos IonInputs ao abrir modais (evita cursor jumping)
  const [createFormKey, setCreateFormKey] = useState(0);
  const [editFormKey, setEditFormKey] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesResponse] = await Promise.all([
        getExpenseCategories()
      ]);
      
      // Extrair categorias do response.data
      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse.data || [];
      
      // Ordenar categorias por nome
      const sortedCategories = categoriesData.sort((a: ExpenseCategory, b: ExpenseCategory) => a.name.localeCompare(b.name));
      setCategories(sortedCategories);
    } catch (error) {
      showToast(t('pages.expenses.errorLoadingData'), 'danger');
    }
    await refresh();
  };

  const loadTypesByCategory = async (categoryId: number) => {
    if (!categoryId) {
      setTypes([]);
      return;
    }

    try {
      const typesResponse = await getExpenseTypes(categoryId);
      // Extrair tipos do response.data se necessário
      const typesData = Array.isArray(typesResponse) ? typesResponse : typesResponse.data || [];
      setTypes(typesData);
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
      setTypes([]);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handleCreateExpense = async () => {
    if (!newExpense.expenseTypeId) {
      showToast(t('pages.expenses.typeRequired'), 'danger');
      return;
    }

    if (newExpense.value < 1) {
      showToast(t('pages.expenses.valueGreaterThanZero'), 'danger');
      return;
    }

    try {
      const response = await createExpense(newExpense);
      if (response.success) {
        showToast(t('pages.expenses.createdSuccess'), 'success');
        setShowCreateModal(false);
        setNewExpense({ 
          value: 0,
          expenseTypeId: 0,
          description: ''
        });
        setSelectedCategory(0);
        setTypes([]);
        loadData();
      } else {
        showToast(response.message || t('pages.expenses.errorCreating'), 'danger');
      }
    } catch (error) {
      showToast(t('pages.expenses.errorCreating'), 'danger');
    }
  };

  const handleEditExpense = async () => {
    if (!editExpense.expenseTypeId) {
      showToast(t('pages.expenses.typeRequired'), 'danger');
      return;
    }

    if (editExpense.value < 1) {
      showToast(t('pages.expenses.valueGreaterThanZero'), 'danger');
      return;
    }

    if (!selectedExpense) return;

    try {
      const response = await updateExpense(selectedExpense.id, editExpense);
      if (response.success) {
        showToast(t('pages.expenses.updatedSuccess'), 'success');
        setShowEditModal(false);
        setEditExpense({ 
          value: 0,
          expenseTypeId: 0,
          description: ''
        });
        setEditSelectedCategory(0);
        setTypes([]);
        setSelectedExpense(null);
        loadData();
      } else {
        showToast(response.message || t('pages.expenses.errorUpdating'), 'danger');
      }
    } catch (error) {
      showToast(t('pages.expenses.errorUpdating'), 'danger');
    }
  };

  const handleDeleteExpense = () => {
    if (!selectedExpense) return;

    deleteExpense(selectedExpense.id)
      .then(response => {
        showToast(response.message || t('pages.expenses.deletedSuccess'), response.success ? 'success' : 'danger');
        
        if (response.success) {
          setShowDeleteAlert(false);
          setSelectedExpense(null);
          loadData();
        }
      })
      .catch((error) => {
        console.error('Erro ao excluir despesa:', error);
        showToast(t('pages.expenses.connectionError'), 'danger');
      });
  };

  const openEditModal = async (expense: Expense) => {
    setSelectedExpense(expense);
    
    // Encontrar a categoria do tipo de despesa
    try {
      const categoriesResponse = await getExpenseCategories();
      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse.data || [];
      
      for (const category of categoriesData) {
        const typesResponse = await getExpenseTypes(category.id);
        const typesData = Array.isArray(typesResponse) ? typesResponse : typesResponse.data || [];
        const typeExists = typesData.some((type: ExpenseType) => type.id === expense.expenseTypeId);
        if (typeExists) {
          setEditSelectedCategory(category.id);
          setTypes(typesData);
          break;
        }
      }
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
    }

    setEditExpense({ 
      value: expense.value,
      expenseTypeId: expense.expenseTypeId,
      description: expense.description
    });
    setEditFormKey(prev => prev + 1);
    setShowEditModal(true);
  };


  const formatDateTime = (dateString: string) => {
    return formatToBrazilTime(dateString);
  };

  const getCategoryName = (typeId: number) => {
    // Em um app real, faria uma busca mais eficiente
    return 'Categoria';
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setNewExpense({ ...newExpense, expenseTypeId: 0 }); // Resetar tipo quando mudar categoria
    loadTypesByCategory(categoryId);
  };

  const handleEditCategoryChange = (categoryId: number) => {
    setEditSelectedCategory(categoryId);
    setEditExpense({ ...editExpense, expenseTypeId: 0 }); // Resetar tipo quando mudar categoria
    loadTypesByCategory(categoryId);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.expenses.title')}</IonTitle>
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
            onClick={() => {
              setNewExpense({ value: 0, expenseTypeId: 0, description: '' });
              setSelectedCategory(0);
              setCreateFormKey(prev => prev + 1);
              setShowCreateModal(true);
            }}
            style={{ marginBottom: '16px' }}
          >
            <IonIcon slot="start" icon={add} />
            {t('pages.expenses.addExpense')}
          </IonButton>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', marginTop: '16px' }}>{t('pages.expenses.loadingExpenses')}</p>
            </div>
          ) : expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t('pages.expenses.noExpensesRegistered')}</p>
            </div>
          ) : (
            <>
              {expenses.map((expense) => (
                <IonCard 
                  key={expense.id} 
                  style={{ 
                    marginBottom: '16px',
                    borderRadius: '12px'
                  }}
                >
                  <IonCardHeader>
                    {expense.expenseTypeName}
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.expenses.value')}: {formatCurrencyWithSymbol(expense.value)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.expenses.type')}: {expense.expenseTypeName}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.expenses.description')}: {expense.description || t('pages.expenses.noDescription')}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                        <IonCol size="12">
                          <IonItem>
                            <IonLabel>
                              <h3>{t('pages.expenses.date')}: {formatDateTime(expense.createdAt)}</h3>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size="6">
                          <IonButton
                            fill="clear"
                            onClick={() => openEditModal(expense)}
                          >
                            <IonIcon icon={create} />
                          </IonButton>
                        </IonCol>
                        <IonCol size="6">
                          <IonButton
                            fill="clear"
                            color="danger"
                            onClick={() => {
                              setSelectedExpense(expense);
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
              ))}
              {/* Sentinel para infinite scroll */}
              <div ref={sentinelRef} style={{ height: '40px', textAlign: 'center', padding: '10px' }}>
                {isLoadingMore && <IonSpinner name="dots" />}
              </div>
            </>
          )}
        </div>

        {/* Modal Criar Despesa */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.expenses.addExpense')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonSelect
                  label={t('pages.expenses.category')}
                  labelPlacement="floating"
                  value={selectedCategory}
                  onIonChange={(e) => handleCategoryChange(e.detail.value as number)}
                >
                  {categories.map((category) => (
                    <IonSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonSelect
                  label={t('pages.expenses.type')}
                  labelPlacement="floating"
                  value={newExpense.expenseTypeId}
                  onIonChange={(e) => setNewExpense({ ...newExpense, expenseTypeId: e.detail.value as number })}
                  disabled={!selectedCategory}
                >
                  {types.map((type) => (
                    <IonSelectOption key={type.id} value={type.id}>
                      {type.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.expenses.value')}
                  labelPlacement="floating"
                  placeholder={t('pages.expenses.valuePlaceholder')}
                  type="number"
                  key={`create-val-${createFormKey}`}
                  onIonChange={(e: any) => {
                    const val = e.detail.value;
                    setNewExpense(prev => ({ ...prev, value: val === '' ? 0 : Number(val) }));
                  }}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.expenses.description')}
                  labelPlacement="floating"
                  placeholder={t('pages.expenses.descriptionPlaceholder')}
                  key={`create-desc-${createFormKey}`}
                  onIonChange={(e: any) => setNewExpense(prev => ({ ...prev, description: e.detail.value || '' }))}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleCreateExpense}
                style={{ marginTop: '16px' }}
              >
                {t('pages.expenses.create')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Despesa */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('pages.expenses.editExpense')}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>{t('common.close')}</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonSelect
                  label={t('pages.expenses.category')}
                  labelPlacement="floating"
                  value={editSelectedCategory}
                  onIonChange={(e) => handleEditCategoryChange(e.detail.value as number)}
                >
                  {categories.map((category) => (
                    <IonSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonSelect
                  label={t('pages.expenses.type')}
                  labelPlacement="floating"
                  value={editExpense.expenseTypeId}
                  onIonChange={(e) => setEditExpense({ ...editExpense, expenseTypeId: e.detail.value as number })}
                  disabled={!editSelectedCategory}
                >
                  {types.map((type) => (
                    <IonSelectOption key={type.id} value={type.id}>
                      {type.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.expenses.value')}
                  labelPlacement="floating"
                  placeholder={t('pages.expenses.valuePlaceholder')}
                  type="number"
                  key={`edit-val-${editFormKey}`}
                  defaultValue={selectedExpense?.value ?? editExpense.value}
                  onIonChange={(e: any) => {
                    const val = e.detail.value;
                    setEditExpense(prev => ({ ...prev, value: val === '' ? 0 : Number(val) }));
                  }}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.expenses.description')}
                  labelPlacement="floating"
                  placeholder={t('pages.expenses.descriptionPlaceholder')}
                  key={`edit-desc-${editFormKey}`}
                  defaultValue={selectedExpense?.description ?? editExpense.description}
                  onIonChange={(e: any) => setEditExpense(prev => ({ ...prev, description: e.detail.value || '' }))}
                />
              </IonItem>
              <IonButton 
                expand="block" 
                shape="round"
                onClick={handleEditExpense}
                style={{ marginTop: '16px' }}
              >
                {t('pages.expenses.update')}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert Excluir */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={t('pages.expenses.confirm')}
          message={t('pages.expenses.confirmDeleteMessage').replace('{expenseTypeName}', selectedExpense?.expenseTypeName || '').replace('{value}', selectedExpense ? formatCurrencyWithSymbol(selectedExpense.value) : '')}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('pages.expenses.confirm'),
              handler: handleDeleteExpense
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

export default Expenses;
