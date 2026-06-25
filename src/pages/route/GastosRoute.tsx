import React, { useState, useEffect } from 'react';
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
  
  const [newGasto, setNewGasto] = useState<GastoForm>({
    categoriaId: 0, tipoId: 0, valor: 0, descricao: ''
  });
  const [editGasto, setEditGasto] = useState<GastoForm>({
    categoriaId: 0, tipoId: 0, valor: 0, descricao: ''
  });

  useEffect(() => { loadData(); setTimeout(setupRefresher, 100); }, []);

  const setupRefresher = () => {
    const el = document.getElementById('gastosroute-refresher') as HTMLIonRefresherElement;
    if (el) el.addEventListener('ionRefresh', async () => { await loadData(); el.complete(); });
  };

  const loadData = async () => {
    setIsLoading(true);
    try { await Promise.all([loadGastos(), loadCategorias()]); }
    finally { setIsLoading(false); }
  };

  const loadGastos = async () => {
    try {
      const [gastosData, totalData] = await Promise.all([getGastosDoDia(), getTotalGastosDia()]);
      setGastos(gastosData);
      setTotalGastos(totalData.total);
    } catch { showToast(t('pages.expensesRoute.errorLoadingExpenses'), 'danger'); }
  };

  const loadCategorias = async () => {
    try { const data = await getCategorias(); setCategorias(data); }
    catch { showToast(t('pages.expensesRoute.errorLoadingCategories'), 'danger'); }
  };

  const loadTipos = async (categoriaId: number) => {
    try { const data = await getTiposGastos(categoriaId); setTipos(data); }
    catch { showToast(t('pages.expensesRoute.errorLoadingTypes'), 'danger'); }
  };

  const showToast = (message: string, color: string) => setToast({ isOpen: true, message, color });

  const validateFields = (gasto: GastoForm) => {
    if (!gasto.categoriaId) { showToast(t('pages.expensesRoute.selectCategory'), 'danger'); return false; }
    if (!gasto.tipoId) { showToast(t('pages.expensesRoute.selectType'), 'danger'); return false; }
    if (!gasto.valor || gasto.valor <= 0) { showToast(t('pages.expensesRoute.validValue'), 'danger'); return false; }
    if (!gasto.descricao.trim()) { showToast(t('pages.expensesRoute.descriptionRequired'), 'danger'); return false; }
    return true;
  };

  const handleCreateGasto = async () => {
    if (!validateFields(newGasto)) return;
    try {
      const response = await createGasto(newGasto);
      showToast(response.message, response.success ? 'success' : 'danger');
      if (response.success) {
        setShowCreateModal(false);
        setNewGasto({ categoriaId: 0, tipoId: 0, valor: 0, descricao: '' });
        setTipos([]); loadGastos();
      }
    } catch { showToast(t('pages.expensesRoute.errorCreatingExpense'), 'danger'); }
  };

  const handleUpdateGasto = async () => {
    if (!selectedGasto || !validateFields(editGasto)) return;
    try {
      const response = await updateGasto(selectedGasto.id, editGasto);
      showToast(response.message, response.success ? 'success' : 'danger');
      if (response.success) {
        setShowEditModal(false);
        setEditGasto({ categoriaId: 0, tipoId: 0, valor: 0, descricao: '' });
        setSelectedGasto(null); setTipos([]); loadGastos();
      }
    } catch { showToast(t('pages.expensesRoute.errorUpdatingExpense'), 'danger'); }
  };

  const handleDeleteGasto = () => {
    if (!selectedGasto) return;
    deleteGasto(selectedGasto.id)
      .then(response => {
        showToast(response.message, response.success ? 'success' : 'danger');
        if (response.success) { setShowDeleteAlert(false); setSelectedGasto(null); loadGastos(); }
      })
      .catch(() => showToast(t('pages.expensesRoute.errorDeletingExpense'), 'danger'));
  };

  const handleCategoriaChange = (categoriaId: number, isEdit: boolean = false) => {
    if (isEdit) setEditGasto({ ...editGasto, categoriaId, tipoId: 0 });
    else setNewGasto({ ...newGasto, categoriaId, tipoId: 0 });
    if (categoriaId > 0) loadTipos(categoriaId);
    else setTipos([]);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#098947' } as any}>
          <IonTitle style={{ color: '#fff', fontWeight: 700, fontFamily: "'League Spartan', sans-serif" }}>
            {t('pages.expensesRoute.title')}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" id="gastosroute-refresher">
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
              <IonSpinner name="dots" />
              <p style={{ color: '#666', fontSize: '14px' }}>{t('pages.expensesRoute.loadingExpenses')}</p>
            </div>
          ) : (
            <>
              {/* Total do Dia */}
              <div style={{
                backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                  backgroundColor: '#dc3545', borderRadius: '16px 0 0 16px'
                }} />
                <div style={{ paddingLeft: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <IonIcon icon={walletOutline} style={{ fontSize: '20px', color: '#dc3545' }} />
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#262626' }}>
                      {t('pages.expensesRoute.dailyExpenses')}
                    </span>
                  </div>
                  <InfoRow label={t('pages.expensesRoute.total')} value={formatCurrencyWithSymbol(totalGastos)} valueColor="#dc3545" showBorder={false} />
                </div>
              </div>

              <PrimaryButton onClick={() => setShowCreateModal(true)} label={t('pages.expensesRoute.addExpense')} icon={addCircle} />

              {gastos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ color: '#999', margin: 0 }}>{t('pages.expensesRoute.noExpensesCreated')}</p>
                </div>
              ) : (
                gastos.map((gasto) => (
                  <div key={gasto.id} style={{
                    backgroundColor: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '12px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                      backgroundColor: '#098947', borderRadius: '16px 0 0 16px'
                    }} />
                    <div style={{ paddingLeft: '8px' }}>
                      <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#262626', marginBottom: '14px' }}>
                        {gasto.categoriaNome}
                      </h2>
                      <InfoRow label={gasto.tipoNome} value={formatCurrencyWithSymbol(gasto.valor)} valueColor="#dc3545" />
                      {gasto.descricao && <InfoRow label={t('pages.expensesRoute.description')} value={gasto.descricao} showBorder={false} />}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                          <ActionButton icon={eye} label={t('common.show')} onClick={() => { setSelectedGasto(gasto); setShowViewModal(true); }} />
                        </div>
                        <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                          <ActionButton icon={create} label={t('common.edit')} onClick={() => {
                            setSelectedGasto(gasto);
                            setEditGasto({ categoriaId: gasto.categoriaId, tipoId: gasto.tipoId, valor: gasto.valor, descricao: gasto.descricao });
                            loadTipos(gasto.categoriaId);
                            setShowEditModal(true);
                          }} />
                        </div>
                        <div style={{ flex: '1 1 30%', minWidth: 0 }}>
                          <ActionButton icon={trash} label={t('common.delete')} backgroundColor="#fff5f5" color="#dc3545"
                            onClick={() => { setSelectedGasto(gasto); setShowDeleteAlert(true); }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Modal Criar */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => { setShowCreateModal(false); setTipos([]); }}>
          <GreenHeader title={t('pages.expensesRoute.newExpense')} onClose={() => { setShowCreateModal(false); setTipos([]); }} />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#098947', borderRadius: '16px 0 0 16px' }} />
                <div style={{ paddingLeft: '8px' }}>
                  <SelectInput
                    label={t('pages.expensesRoute.category')}
                    value={newGasto.categoriaId}
                    options={categorias.map(c => ({ id: c.id, name: c.name }))}
                    onChange={(val) => handleCategoriaChange(val)}
                    placeholder={t('pages.expensesRoute.select')}
                  />
                  <SelectInput
                    label={t('pages.expensesRoute.type')}
                    value={newGasto.tipoId}
                    options={tipos.map(t => ({ id: t.id, name: t.name }))}
                    onChange={(val) => setNewGasto({ ...newGasto, tipoId: val })}
                    disabled={newGasto.categoriaId === 0}
                    placeholder={t('pages.expensesRoute.select')}
                  />
                  <IonItem style={inputStyle}>
                    <IonInput label={t('pages.expensesRoute.value')} labelPlacement="floating" placeholder={t('pages.expensesRoute.enterValue')}
                      type="number" value={newGasto.valor} onIonInput={(e: any) => setNewGasto({ ...newGasto, valor: Number(e.detail.value) })} />
                  </IonItem>
                  <IonItem style={{ ...inputStyle, marginBottom: '4px' }}>
                    <IonInput label={t('pages.expensesRoute.description')} labelPlacement="floating" placeholder={t('pages.expensesRoute.enterDescription')}
                      value={newGasto.descricao} onIonInput={(e: any) => setNewGasto({ ...newGasto, descricao: e.detail.value! })} />
                  </IonItem>
                  <PrimaryButton onClick={handleCreateGasto} label={t('pages.expensesRoute.create')} style={{ marginTop: '4px' }} />
                </div>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Editar */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => { setShowEditModal(false); setSelectedGasto(null); setTipos([]); }}>
          <GreenHeader title={t('pages.expensesRoute.editExpense')} onClose={() => { setShowEditModal(false); setSelectedGasto(null); setTipos([]); }} />
          <IonContent>
            <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#098947', borderRadius: '16px 0 0 16px' }} />
                <div style={{ paddingLeft: '8px' }}>
                  <SelectInput
                    label={t('pages.expensesRoute.category')}
                    value={editGasto.categoriaId}
                    options={categorias.map(c => ({ id: c.id, name: c.name }))}
                    onChange={(val) => handleCategoriaChange(val, true)}
                    placeholder={t('pages.expensesRoute.select')}
                  />
                  <SelectInput
                    label={t('pages.expensesRoute.type')}
                    value={editGasto.tipoId}
                    options={tipos.map(t => ({ id: t.id, name: t.name }))}
                    onChange={(val) => setEditGasto({ ...editGasto, tipoId: val })}
                    disabled={editGasto.categoriaId === 0}
                    placeholder={t('pages.expensesRoute.select')}
                  />
                  <IonItem style={inputStyle}>
                    <IonInput label={t('pages.expensesRoute.value')} labelPlacement="floating" placeholder={t('pages.expensesRoute.enterValue')}
                      type="number" value={editGasto.valor} onIonInput={(e: any) => setEditGasto({ ...editGasto, valor: Number(e.detail.value) })} />
                  </IonItem>
                  <IonItem style={{ ...inputStyle, marginBottom: '4px' }}>
                    <IonInput label={t('pages.expensesRoute.description')} labelPlacement="floating" placeholder={t('pages.expensesRoute.enterDescription')}
                      value={editGasto.descricao} onIonInput={(e: any) => setEditGasto({ ...editGasto, descricao: e.detail.value! })} />
                  </IonItem>
                  <PrimaryButton onClick={handleUpdateGasto} label={t('pages.expensesRoute.save')} style={{ marginTop: '4px' }} />
                </div>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal Ver */}
        <IonModal isOpen={showViewModal} onDidDismiss={() => { setShowViewModal(false); setSelectedGasto(null); }}>
          <GreenHeader title={t('pages.expensesRoute.expenseDetails')} onClose={() => { setShowViewModal(false); setSelectedGasto(null); }} />
          <IonContent>
            {selectedGasto && (
              <div style={{ padding: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#098947', borderRadius: '16px 0 0 16px' }} />
                  <div style={{ paddingLeft: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#262626', marginBottom: '14px' }}>
                      {selectedGasto.categoriaNome} - {selectedGasto.tipoNome}
                    </div>
                    <InfoRow label={t('pages.expensesRoute.value')} value={formatCurrencyWithSymbol(selectedGasto.valor)} valueColor="#dc3545" />
                    <InfoRow label={t('pages.expensesRoute.description')} value={selectedGasto.descricao} />
                    <InfoRow label={t('pages.expensesRoute.date')} value={formatToBrazilTime(selectedGasto.data)} showBorder={false} />
                  </div>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={t('pages.expensesRoute.confirmDelete')}
          message={t('pages.expensesRoute.confirmDeleteMessage').replace('{expenseDescription}', selectedGasto?.descricao || '')}
          buttons={[
            { text: t('common.cancel'), role: 'cancel' },
            { text: t('pages.expensesRoute.delete'), role: 'destructive', handler: handleDeleteGasto }
          ]}
        />

        <Toast isOpen={toast.isOpen} message={toast.message} color={toast.color}
          onDidDismiss={() => setToast({ ...toast, isOpen: false })} />
      </IonContent>
    </IonPage>
  );
};

export default GastosRoute;
