import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  IonButtons,
  IonBackButton,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonDatetime,
  IonIcon
} from '@ionic/react';
import { arrowBack, calendarOutline } from 'ionicons/icons';
import { 
  getCategorias, 
  getDetalhesGastos,
  CategoriaGasto,
  GastoDetalhe,
  CategoriaDetalhesResponse,
  DetalhesRequest
} from '../../services/gastoApi';
import Toast from '../../components/Toast';

const DetalhesGastos: React.FC = () => {
  const { categoriaId } = useParams<{ categoriaId: string }>();
  const [categoria, setCategoria] = useState<CategoriaGasto | null>(null);
  const [detalhes, setDetalhes] = useState<CategoriaDetalhesResponse | null>(null);
  const [periodo, setPeriodo] = useState<'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_60_DAYS' | 'LAST_90_DAYS' | 'ALL_TIME' | 'custom'>('LAST_30_DAYS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarType, setCalendarType] = useState<'start' | 'end'>('start');
  const [dataInicioValida, setDataInicioValida] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: '' });

  useEffect(() => {
    if (categoriaId) {
      loadCategoria();
    }
  }, [categoriaId]);

  useEffect(() => {
    if (categoria) {
      loadDetalhes();
    }
  }, [categoria, periodo, dataInicio, dataFim]);

  const loadCategoria = async () => {
    try {
      const categorias = await getCategorias();
      const cat = categorias.find((c: CategoriaGasto) => c.id === parseInt(categoriaId!));
      if (cat) {
        setCategoria(cat);
      }
    } catch (error) {
      showToast('Erro ao carregar categoria', 'danger');
    }
  };

  const loadDetalhes = async () => {
    try {
      let request: DetalhesRequest;
      
      if (periodo === 'custom') {
        if (!dataInicio || !dataFim) {
          showToast('Selecione as datas para o período personalizado', 'danger');
          return;
        }
        request = {
          dateFrom: new Date(dataInicio).toISOString(),
          dateTo: new Date(dataFim).toISOString()
        };
      } else {
        request = {
          timePeriod: periodo
        };
      }
      
      console.log('Enviando request para detalhes:', request);
      console.log('Categoria ID:', categoriaId);
      
      const data = await getDetalhesGastos(parseInt(categoriaId!), request);
      console.log('Response recebido:', data);
      
      setDetalhes(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      showToast('Erro ao carregar detalhes dos gastos', 'danger');
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handlePeriodoChange = (value: string) => {
    console.log('Período selecionado:', value);
    const periodValue = value as any;
    setPeriodo(periodValue);
    const shouldShowCustom = value === 'custom';
    console.log('Mostrar período personalizado:', shouldShowCustom);
    setShowCustomPeriod(shouldShowCustom);
    if (value !== 'custom') {
      setDataInicio('');
      setDataFim('');
      setDataInicioValida(false);
    }
  };

  const handleDataInicioChange = (value: string) => {
    setDataInicio(value);
    setDataInicioValida(value !== '');
    if (value && dataFim && new Date(dataFim) < new Date(value)) {
      setDataFim('');
      showToast('Data final deve ser posterior à data inicial', 'warning');
    }
  };

  const handleDataFimChange = (value: string) => {
    if (dataInicio && new Date(value) < new Date(dataInicio)) {
      showToast('Data final não pode ser anterior à data inicial', 'danger');
      return;
    }
    setDataFim(value);
  };

  const openCalendar = (type: 'start' | 'end') => {
    setCalendarType(type);
    setShowCalendarModal(true);
  };

  const handleDateSelected = (event: any) => {
    const selectedDate = event.detail.value;
    
    if (calendarType === 'start') {
      setDataInicio(selectedDate);
      setDataInicioValida(true);
      // Limpa data fim se for anterior à nova data início
      if (dataFim && new Date(dataFim) < new Date(selectedDate)) {
        setDataFim('');
      }
    } else {
      setDataFim(selectedDate);
    }
    
    setShowCalendarModal(false);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/manager/gastos" icon={arrowBack} />
          </IonButtons>
          <IonTitle>Detalhes de Gastos</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px' }}>
          {/* Card de Seleção de Período */}
          <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>Selecione o período</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Período</IonLabel>
                <IonSelect
                  value={periodo}
                  onIonChange={(e: any) => handlePeriodoChange(e.detail.value)}
                  placeholder="Selecione um período"
                >
                  <IonSelectOption value="TODAY">Hoje</IonSelectOption>
                  <IonSelectOption value="LAST_7_DAYS">Últimos 7 dias</IonSelectOption>
                  <IonSelectOption value="LAST_30_DAYS">Últimos 30 dias</IonSelectOption>
                  <IonSelectOption value="LAST_60_DAYS">Últimos 60 dias</IonSelectOption>
                  <IonSelectOption value="LAST_90_DAYS">Últimos 90 dias</IonSelectOption>
                  <IonSelectOption value="ALL_TIME">Todo o tempo</IonSelectOption>
                  <IonSelectOption value="custom">Período personalizado</IonSelectOption>
                </IonSelect>
              </IonItem>

              {showCustomPeriod && (
                <>
                  <IonItem button onClick={() => openCalendar('start')}>
                    <IonLabel position="stacked">Data Início</IonLabel>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ color: dataInicio ? '#262626' : '#999' }}>
                        {dataInicio ? formatDateDisplay(dataInicio) : 'Selecione a data inicial'}
                      </span>
                      <IonIcon icon={calendarOutline} style={{ color: '#305bcb' }} />
                    </div>
                  </IonItem>
                  <IonItem button onClick={() => openCalendar('end')} disabled={!dataInicioValida}>
                    <IonLabel position="stacked">Data Fim</IonLabel>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ color: dataFim ? '#262626' : '#999' }}>
                        {dataFim ? formatDateDisplay(dataFim) : 'Selecione a data final'}
                      </span>
                      <IonIcon icon={calendarOutline} style={{ color: dataInicioValida ? '#305bcb' : '#ccc' }} />
                    </div>
                  </IonItem>
                </>
              )}

              <IonButton 
                expand="block" 
                shape="round"
                onClick={loadDetalhes}
                style={{ marginTop: '16px' }}
              >
                Filtrar
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Card de Resultados */}
          {detalhes && (
            <IonCard style={{ borderRadius: '12px' }}>
              <IonCardHeader>
                <IonCardTitle>
                  {categoria?.name} - {formatCurrency(detalhes.totalAmount)}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="12">
                      <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>
                        Total Gasto: {formatCurrency(detalhes.totalAmount)}
                      </h3>
                    </IonCol>
                  </IonRow>
                  
                  <IonRow>
                    <IonCol size="12">
                      <h4 style={{ marginBottom: '12px' }}>Gastos por Tipo:</h4>
                    </IonCol>
                  </IonRow>

                  {detalhes.expenseTypes.map((detalhe, index) => (
                    <IonRow key={index}>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{detalhe.typeName}</h3>
                            <p style={{ color: '#666', fontSize: '14px' }}>
                              {formatCurrency(detalhe.amount)}
                            </p>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  ))}
                </IonGrid>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        {/* Toast */}
        <Toast
          isOpen={toast.isOpen}
          message={toast.message}
          color={toast.color}
          onDidDismiss={() => setToast({ ...toast, isOpen: false })}
        />

        {/* Modal de Calendário */}
        <IonModal 
          isOpen={showCalendarModal} 
          onDidDismiss={() => setShowCalendarModal(false)}
          initialBreakpoint={0.6}
          breakpoints={[0, 0.6, 1]}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {calendarType === 'start' ? 'Selecione a Data Início' : 'Selecione a Data Fim'}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCalendarModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '10px',
              minHeight: '400px',
              maxHeight: '500px'
            }}>
              <IonDatetime
                presentation="date"
                onIonChange={handleDateSelected}
                value={calendarType === 'start' ? dataInicio : dataFim}
                min={calendarType === 'end' ? dataInicio : undefined}
                locale="pt-BR"
                firstDayOfWeek={1}
                showDefaultButtons={true}
                doneText="Confirmar"
                cancelText="Cancelar"
                style={{
                  maxWidth: '320px',
                  width: '100%',
                  marginBottom: '20px'
                }}
              />
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default DetalhesGastos;
