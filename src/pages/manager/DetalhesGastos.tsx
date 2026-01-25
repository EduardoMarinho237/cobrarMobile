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
  IonButtons,
  IonBackButton,
  IonGrid,
  IonRow,
  IonCol,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonDatetime,
  IonIcon
} from '@ionic/react';
import { refresh } from 'ionicons/icons';
import {
  getCategorias,
  getDetalhesGastos,
  CategoriaGasto,
  CategoriaDetalhesResponse,
  DetalhesRequest
} from '../../services/gastoApi';
import Toast from '../../components/Toast';

const DetalhesGastos: React.FC = () => {
  const { categoriaId } = useParams<{ categoriaId: string }>();

  const [categoria, setCategoria] = useState<CategoriaGasto | null>(null);
  const [detalhes, setDetalhes] = useState<CategoriaDetalhesResponse | null>(null);
  const [periodo, setPeriodo] = useState<
    'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_60_DAYS' | 'LAST_90_DAYS' | 'ALL_TIME' | 'custom'
  >('LAST_30_DAYS');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; color: string }>({
    isOpen: false,
    message: '',
    color: ''
  });

  useEffect(() => {
    loadCategoria();
  }, [categoriaId]);

  const loadCategoria = async () => {
    try {
      const data = await getCategorias();
      const cat = data.find((c: CategoriaGasto) => c.id === Number(categoriaId));
      setCategoria(cat || null);
    } catch {
      showToast('Erro ao carregar categoria', 'danger');
    }
  };

  const loadDetalhes = async () => {
    setIsLoading(true);
    try {
      const request: DetalhesRequest = {};
      
      if (periodo === 'custom') {
        if (dataInicio && dataFim) {
          request.dateFrom = new Date(dataInicio).toISOString();
          request.dateTo = new Date(dataFim).toISOString();
        } else {
          showToast('Selecione um período personalizado válido', 'danger');
          return;
        }
      } else {
        request.timePeriod = periodo as any;
      }
      
      const data = await getDetalhesGastos(Number(categoriaId), request);
      setDetalhes(data);
    } catch {
      showToast('Erro ao carregar detalhes', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, color: string) => {
    setToast({ isOpen: true, message, color });
  };

  const handlePeriodoChange = (value: string) => {
    if (value === 'custom') {
      setPeriodo('custom');
      setShowCalendarModal(true);
    } else {
      setPeriodo(value as any);
      setDataInicio('');
      setDataFim('');
    }
  };

  const handleCustomPeriodApply = () => {
    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      
      if (inicio >= fim) {
        showToast('A data inicial deve ser anterior à data final', 'danger');
        return;
      }
      
      setShowCalendarModal(false);
      loadDetalhes();
    } else {
      showToast('Preencha ambas as datas', 'danger');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/manager/gastos" />
          </IonButtons>
          <IonTitle>Detalhes de Gastos</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async event => {
            await Promise.all([loadCategoria(), loadDetalhes()]);
            event.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: '16px' }}>
          <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>Selecione o período</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Período</IonLabel>
                <IonSelect
                  value={periodo}
                  placeholder="Selecione um período"
                  onIonChange={e => handlePeriodoChange(e.detail.value)}
                >
                  <IonSelectOption value="TODAY">Hoje</IonSelectOption>
                  <IonSelectOption value="LAST_7_DAYS">Últimos 7 dias</IonSelectOption>
                  <IonSelectOption value="LAST_30_DAYS">Últimos 30 dias</IonSelectOption>
                  <IonSelectOption value="LAST_60_DAYS">Últimos 60 dias</IonSelectOption>
                  <IonSelectOption value="LAST_90_DAYS">Últimos 90 dias</IonSelectOption>
                  <IonSelectOption value="ALL_TIME">Todo o período</IonSelectOption>
                  <IonSelectOption value="custom">Período personalizado</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonButton
                expand="block"
                fill="outline"
                onClick={loadDetalhes}
                disabled={isLoading}
                style={{ marginTop: '12px' }}
              >
                <IonIcon slot="start" icon={refresh} />
                Filtrar
              </IonButton>
            </IonCardContent>
          </IonCard>

          {categoria && (
            <IonCard style={{ marginBottom: '16px', borderRadius: '12px' }}>
              <IonCardHeader>
                <IonCardTitle>{categoria.name}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonLabel>
                    <h3>Total de Gastos</h3>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc3545' }}>
                      {formatCurrency(detalhes?.totalAmount || 0)}
                    </p>
                  </IonLabel>
                </IonItem>
              </IonCardContent>
            </IonCard>
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Carregando...</p>
            </div>
          ) : detalhes?.expenseTypes?.length ? (
            detalhes.expenseTypes.map((expenseType: any, index: number) => (
              <IonCard key={index} style={{ marginBottom: '12px', borderRadius: '12px' }}>
                <IonCardHeader>
                  <IonCardTitle>{expenseType.typeName}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol>
                        <IonItem>
                          <IonLabel>
                            <h3>Quantidade</h3>
                            <p>{expenseType.expenseCount}</p>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol>
                        <IonItem>
                          <IonLabel>
                            <h3>Valor Total</h3>
                            <p>{formatCurrency(expenseType.totalAmount)}</p>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol>
                        <IonItem>
                          <IonLabel>
                            <h3>Valor Médio</h3>
                            <p>{formatCurrency(expenseType.totalAmount / expenseType.expenseCount)}</p>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            ))
          ) : (
            <IonCard style={{ borderRadius: '12px' }}>
              <IonCardContent>
                <p style={{ textAlign: 'center' }}>
                  Nenhum gasto encontrado no período selecionado
                </p>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        <IonModal isOpen={showCalendarModal} onDidDismiss={() => setShowCalendarModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Período Personalizado</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCalendarModal(false)}>Fechar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '16px' }}>
              <IonItem>
                <IonLabel position="stacked">Data Início</IonLabel>
                <IonDatetime
                  presentation="date"
                  value={dataInicio}
                  onIonChange={e => setDataInicio(e.detail.value as string)}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Data Fim</IonLabel>
                <IonDatetime
                  presentation="date"
                  value={dataFim}
                  onIonChange={e => setDataFim(e.detail.value as string)}
                />
              </IonItem>
              <IonButton
                expand="block"
                onClick={handleCustomPeriodApply}
                disabled={!dataInicio || !dataFim}
                style={{ marginTop: '16px' }}
              >
                Aplicar Período
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

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
