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
import { 
  Expense, 
  CreateExpenseRequest, 
  UpdateExpenseRequest,
  getExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense 
} from '../../services/expenseApi';
import { getExpenseCategories, getExpenseTypes, ExpenseCategory, ExpenseType } from '../../services/expenseApi';
import Toast from '../../components/Toast';
import { useTranslation } from 'react-i18next';

const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [types, setTypes] = useState<ExpenseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [expensesData, categoriesResponse] = await Promise.all([
        getExpenses(),
        getExpenseCategories()
      ]);
      setExpenses(expensesData);
      
      // Extrair categorias do response.data
      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse.data || [];
      
      // Ordenar categorias por nome
      const sortedCategories = categoriesData.sort((a: ExpenseCategory, b: ExpenseCategory) => a.name.localeCompare(b.name));
      setCategories(sortedCategories);
    } catch (error) {
      showToast(t('pages.expenses.errorLoadingData'), 'danger');
    } finally {
      setIsLoading(false);
    }
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
    setShowEditModal(true);
  };


  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
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
            onClick={() => setShowCreateModal(true)}
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
            expenses.map((expense) => (
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
            ))
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
                  value={newExpense.value}
                  onIonInput={(e: any) => setNewExpense({ ...newExpense, value: Number(e.detail.value) })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.expenses.description')}
                  labelPlacement="floating"
                  placeholder={t('pages.expenses.descriptionPlaceholder')}
                  value={newExpense.description}
                  onIonInput={(e: any) => setNewExpense({ ...newExpense, description: e.detail.value })}
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
                  value={editExpense.value}
                  onIonInput={(e: any) => setEditExpense({ ...editExpense, value: Number(e.detail.value) })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('pages.expenses.description')}
                  labelPlacement="floating"
                  placeholder={t('pages.expenses.descriptionPlaceholder')}
                  value={editExpense.description}
                  onIonInput={(e: any) => setEditExpense({ ...editExpense, description: e.detail.value })}
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
