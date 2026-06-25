import React, { useState, useEffect, useCallback } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonModal,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/react';
import SelectInput from '../../components/ui/SelectInput';
import { addCircle, trash, create, eye, walletOutline } from 'ionicons/icons';
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
import GreenHeader from '../../components/ui/GreenHeader';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InfoRow from '../../components/ui/InfoRow';
import ActionButton from '../../components/ui/ActionButton';

const inputStyle = {
  '--background': '#f5f5f5',
  '--border-radius': '12px',
  '--padding-start': '16px',
  '--inner-padding-end': '16px',
  '--min-height': '52px',
  marginBottom: '8px',
} as any;

const Expenses: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [types, setTypes] = useState<ExpenseType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
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

  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [editSelectedCategory, setEditSelectedCategory] = useState<number>(0);

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

      const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse.data || [];
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
    setEditExpense({
      value: expense.value,
      expenseTypeId: expense.expenseTypeId,
      description: expense.description || ''
    });

    setSelectedExpense(expense);

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

    setEditFormKey(prev => prev + 1);
    setShowEditModal(true);
  };

  const formatDateTime = (dateString: string) => {
    return formatToBrazilTime(dateString);
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setNewExpense({ ...newExpense, expenseTypeId: 0 });
    loadTypesByCategory(categoryId);
  };

  const handleEditCategoryChange = (categoryId: number) => {
    setEditSelectedCategory(categoryId);
    setEditExpense({ ...editExpense, expenseTypeId: 0 });
    loadTypesByCategory(categoryId);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#098947' } as any}>
          <IonTitle style={{ color: '#fff', fontWeight: 700, fontFamily: "'League Spartan', sans-serif" }}>
            {t('pages.expenses.title')}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={loadData}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          <PrimaryButton
            onClick={() => {
              setNewExpense({ value: 0, expenseTypeId: 0, description: '' });
              setSelectedCategory(0);
              setCreateFormKey(prev => prev + 1);
              setShowCreateModal(true);
            }}
            label={t('pages.expenses.addExpense')}
            icon={addCircle}
          />

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', fontSize: '14px' }}>{t('pages.expenses.loadingExpenses')}</p>
            </div>
          ) : expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#999', margin: 0 }}>{t('pages.expenses.noExpensesRegistered')}</p>
            </div>
          ) : (
            <>
              {expenses.map((expense) => (
                <div key={expense.id} style={{
                  backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '12px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                    backgroundColor: '#098947', borderRadius: '16px 0 0 16px'
                  }} />
                  <div style={{ paddingLeft: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#262626', marginBottom: '14px' }}>
                      {expense.expenseTypeName}
                    </h2>
                    <InfoRow label={t('pages.expenses.value')} value={formatCurrencyWithSymbol(expense.value)} valueColor="#dc3545" />
                    <InfoRow label={t('pages.expenses.description')} value={expense.description || t('pages.expenses.noDescription')} showBorder={false} />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <div style={{ flex: '1 1 45%', minWidth: 0 }}>
                        <ActionButton icon={eye} label={t('common.show')} onClick={() => { setSelectedExpense(expense); setShowViewModal(true); }} />
                      </div>
                      <div style={{ flex: '1 1 45%', minWidth: 0 }}>
                        <ActionButton icon={create} label={t('common.edit')} onClick={() => openEditModal(expense)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <div style={{ flex: '1 1 45%', minWidth: 0 }}>
                        <ActionButton icon={trash} label={t('common.delete')} backgroundColor="#fff5f5" color="#dc3545"
                          onClick={() => { setSelectedExpense(expense); setShowDeleteAlert(true); }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={sentinelRef} style={{ height: '40px', textAlign: 'center', padding: '10px' }}>
                {isLoadingMore && <IonSpinner name="dots" />}
              </div>
            </>
          )}
        </div>

        {/* Modal Criar Despesa */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => { setShowCreateModal(false); setTypes([]); }}>
          <GreenHeader title={t('pages.expenses.addExpense')} onClose={() => { setShowCreateModal(false); setTypes([]); }} />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#098947', borderRadius: '16px 0 0 16px' }} />
                <div style={{ paddingLeft: '8px' }}>
                  <SelectInput
                    label={t('pages.expenses.category')}
                    value={selectedCategory}
                    options={categories.map(c => ({ id: c.id, name: c.name }))}
                    onChange={(val) => handleCategoryChange(val)}
                    placeholder={t('pages.expenses.select')}
                  />
                  <SelectInput
                    label={t('pages.expenses.type')}
                    value={newExpense.expenseTypeId}
                    options={types.map(t => ({ id: t.id, name: t.name }))}
                    onChange={(val) => setNewExpense({ ...newExpense, expenseTypeId: val })}
                    disabled={!selectedCategory}
                    placeholder={t('pages.expenses.select')}
                  />
                  <IonItem style={inputStyle}>
                    <IonInput label={t('pages.expenses.value')} labelPlacement="floating" placeholder={t('pages.expenses.valuePlaceholder')}
                      type="number"
                      value={newExpense.value || ''}
                      onIonInput={(e: any) => {
                        const val = e.target.value;
                        setNewExpense(prev => ({ ...prev, value: val === '' ? 0 : Number(val) }));
                      }} />
                  </IonItem>
                  <IonItem style={{ ...inputStyle, marginBottom: '4px' }}>
                    <IonInput label={t('pages.expenses.description')} labelPlacement="floating" placeholder={t('pages.expenses.descriptionPlaceholder')}
                      value={newExpense.description}
                      onIonInput={(e: any) => setNewExpense(prev => ({ ...prev, description: e.target.value || '' }))} />
                  </IonItem>
                  <PrimaryButton onClick={handleCreateExpense} label={t('pages.expenses.create')} style={{ marginTop: '4px' }} />
                </div>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar Despesa */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => { setShowEditModal(false); setSelectedExpense(null); setTypes([]); }}>
          <GreenHeader title={t('pages.expenses.editExpense')} onClose={() => { setShowEditModal(false); setSelectedExpense(null); setTypes([]); }} />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#098947', borderRadius: '16px 0 0 16px' }} />
                <div style={{ paddingLeft: '8px' }}>
                  <SelectInput
                    label={t('pages.expenses.category')}
                    value={editSelectedCategory}
                    options={categories.map(c => ({ id: c.id, name: c.name }))}
                    onChange={(val) => handleEditCategoryChange(val)}
                    placeholder={t('pages.expenses.select')}
                  />
                  <SelectInput
                    label={t('pages.expenses.type')}
                    value={editExpense.expenseTypeId}
                    options={types.map(t => ({ id: t.id, name: t.name }))}
                    onChange={(val) => setEditExpense({ ...editExpense, expenseTypeId: val })}
                    disabled={!editSelectedCategory}
                    placeholder={t('pages.expenses.select')}
                  />
                  <IonItem style={inputStyle}>
                    <IonInput label={t('pages.expenses.value')} labelPlacement="floating" placeholder={t('pages.expenses.valuePlaceholder')}
                      type="number"
                      value={editExpense.value}
                      onIonInput={(e: any) => {
                        const val = e.target.value;
                        setEditExpense(prev => ({ ...prev, value: val === '' ? 0 : Number(val) }));
                      }} />
                  </IonItem>
                  <IonItem style={{ ...inputStyle, marginBottom: '4px' }}>
                    <IonInput label={t('pages.expenses.description')} labelPlacement="floating" placeholder={t('pages.expenses.descriptionPlaceholder')}
                      value={editExpense.description}
                      onIonInput={(e: any) => setEditExpense(prev => ({ ...prev, description: e.target.value || '' }))} />
                  </IonItem>
                  <PrimaryButton onClick={handleEditExpense} label={t('pages.expenses.update')} style={{ marginTop: '4px' }} />
                </div>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Ver Despesa */}
        <IonModal isOpen={showViewModal} onDidDismiss={() => { setShowViewModal(false); setSelectedExpense(null); }}>
          <GreenHeader title={t('pages.expenses.expenseDetails')} onClose={() => { setShowViewModal(false); setSelectedExpense(null); }} />
          <IonContent>
            {selectedExpense && (
              <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#098947', borderRadius: '16px 0 0 16px' }} />
                  <div style={{ paddingLeft: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#262626', marginBottom: '14px' }}>
                      {selectedExpense.expenseTypeName}
                    </h2>
                    <InfoRow label={t('pages.expenses.value')} value={formatCurrencyWithSymbol(selectedExpense.value)} valueColor="#dc3545" />
                    <InfoRow label={t('pages.expenses.description')} value={selectedExpense.description || t('pages.expenses.noDescription')} />
                    <InfoRow label={t('pages.expenses.date')} value={formatDateTime(selectedExpense.createdAt)} showBorder={false} />
                  </div>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Alert Excluir */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={t('pages.expenses.confirm')}
          message={t('pages.expenses.confirmDeleteMessage').replace('{expenseTypeName}', selectedExpense?.expenseTypeName || '').replace('{value}', selectedExpense ? formatCurrencyWithSymbol(selectedExpense.value) : '')}
          buttons={[
            { text: t('common.cancel'), role: 'cancel' },
            { text: t('pages.expenses.confirm'), role: 'destructive', handler: handleDeleteExpense }
          ]}
        />

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
