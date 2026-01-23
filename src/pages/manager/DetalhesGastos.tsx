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
  IonCol
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { 
  getCategorias, 
  getDetalhesGastos,
  CategoriaGasto,
  GastoDetalhe 
} from '../../services/gastoApi';
import Toast from '../../components/Toast';

const DetalhesGastos: React.FC = () => {
  const { categoriaId } = useParams<{ categoriaId: string }>();
  const [categoria, setCategoria] = useState<CategoriaGasto | null>(null);
  const [detalhes, setDetalhes] = useState<{ total: number; detalhes: GastoDetalhe[] } | null>(null);
  const [periodo, setPeriodo] = useState('todo');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);
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
      let periodoParam = periodo;
      
      if (periodo === 'custom') {
        if (!dataInicio || !dataFim) {
          showToast('Selecione as datas para o período personalizado', 'danger');
          return;
        }
        periodoParam = `${dataInicio}_${dataFim}`;
      }
      
      const data = await getDetalhesGastos(parseInt(categoriaId!), periodoParam);
      setDetalhes(data);
    } catch (error) {
      showToast('Erro ao carregar detalhes dos gastos', 'danger');
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handlePeriodoChange = (value: string) => {
    setPeriodo(value);
    setShowCustomPeriod(value === 'custom');
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
                >
                  <IonSelectOption value="todo">Todo o tempo</IonSelectOption>
                  <IonSelectOption value="3meses">Últimos 3 meses</IonSelectOption>
                  <IonSelectOption value="1mes">Último mês</IonSelectOption>
                  <IonSelectOption value="7dias">Última semana (últimos 7 dias)</IonSelectOption>
                  <IonSelectOption value="custom">Período personalizado</IonSelectOption>
                </IonSelect>
              </IonItem>

              {showCustomPeriod && (
                <>
                  <IonItem>
                    <IonLabel position="stacked">Data Início</IonLabel>
                    <IonInput
                      type="date"
                      value={dataInicio}
                      onIonInput={(e: any) => handleDataInicioChange(e.detail.value!)}
                    />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Data Fim</IonLabel>
                    <IonInput
                      type="date"
                      value={dataFim}
                      onIonInput={(e: any) => handleDataFimChange(e.detail.value!)}
                      disabled={!dataInicioValida}
                    />
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
                  {categoria?.nome} - {formatCurrency(detalhes.total)}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="12">
                      <h3 style={{ textAlign: 'center', marginBottom: '16px' }}>
                        Total Gasto: {formatCurrency(detalhes.total)}
                      </h3>
                    </IonCol>
                  </IonRow>
                  
                  <IonRow>
                    <IonCol size="12">
                      <h4 style={{ marginBottom: '12px' }}>Gastos por Tipo:</h4>
                    </IonCol>
                  </IonRow>

                  {detalhes.detalhes.map((detalhe, index) => (
                    <IonRow key={index}>
                      <IonCol size="12">
                        <IonItem>
                          <IonLabel>
                            <h3>{detalhe.tipo}</h3>
                            <p style={{ color: '#666', fontSize: '14px' }}>
                              {formatCurrency(detalhe.valor)}
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
      </IonContent>
    </IonPage>
  );
};

export default DetalhesGastos;
