import React from 'react';
import {
  IonModal,
  IonButton,
  IonIcon,
  IonContent,
  IonFooter,
} from '@ionic/react';
import { shareSocial, chevronBack, chevronForward } from 'ionicons/icons';
import type jsPDF from 'jspdf';
import { Document, Page, pdfjs } from 'react-pdf';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useTranslation } from 'react-i18next';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { sharePdf } from '../utils/saveFile';
import Toast from './Toast';
import GreenHeader from './ui/GreenHeader';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: jsPDF | null;
  fileName: string;
  title?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class PdfErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  doc,
  fileName,
  title,
}) => {
  const { t } = useTranslation();
  const [pdfUrl, setPdfUrl] = React.useState<string>('');
  const [numPages, setNumPages] = React.useState<number>(0);
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastColor, setToastColor] = React.useState('success');

  const renderWidth = React.useMemo(() => Math.min(window.innerWidth - 32, 800) * 2, []);

  React.useEffect(() => {
    let url = '';
    if (isOpen && doc) {
      setIsLoading(true);
      setError(null);
      setShowToast(false);
      setPageNumber(1);
      try {
        const blob = doc.output('blob');
        url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error('Erro ao converter PDF:', err);
        setError(t('pdfViewer.loadError'));
        setIsLoading(false);
      }
    } else {
      setPdfUrl('');
      setNumPages(0);
      setPageNumber(1);
      setError(null);
      setShowToast(false);
      setIsLoading(false);
    }
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [isOpen, doc, t]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const handleDocumentLoadError = (err: Error) => {
    console.error('Erro ao carregar PDF:', err);
    setError(t('pdfViewer.loadError'));
    setIsLoading(false);
  };

  const handleRenderError = (err: Error) => {
    console.error('Erro ao renderizar página:', err);
    setError(t('pdfViewer.renderError'));
    setIsLoading(false);
  };

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const showToastMessage = (message: string, color: string) => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleShare = async () => {
    if (!doc) return;
    setIsSaving(true);
    setShowToast(false);
    try {
      await sharePdf(doc, fileName);
      showToastMessage(t('pdfViewer.shareSuccess'), 'success');
    } catch (err) {
      console.error('Erro ao compartilhar PDF:', err);
      showToastMessage(t('pdfViewer.shareError'), 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="pdf-viewer-modal">
      <GreenHeader
        title={title || t('pdfViewer.title')}
        onClose={onClose}
        onAction={handleShare}
        actionIcon={shareSocial}
        actionDisabled={isSaving || !pdfUrl}
      />
      <IonContent className="ion-no-padding" scrollY={false}>
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
            position: 'relative',
          }}
        >
          {error && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#dc3545' }}>
              {error}
            </div>
          )}
          {(isLoading || !pdfUrl) && !error && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
              {t('pdfViewer.loading')}
            </div>
          )}
          {pdfUrl && !error && (
            <TransformWrapper
              initialScale={0.5}
              minScale={0.5}
              maxScale={2}
              pinch={{ step: 5 }}
              doubleClick={{ mode: 'reset' }}
              wheel={{ step: 0.1 }}
              centerOnInit
              limitToBounds={false}
              velocityAnimation={{ disabled: true }}
            >
              <>
                <div style={{ width: '100%', height: 'calc(100% - 64px)', overflow: 'hidden' }}>
                  <TransformComponent
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    contentStyle={{ width: '100%', height: '100%' }}
                  >
                    <PdfErrorBoundary
                      onError={(err) => {
                        console.error('Erro no renderizador de PDF:', err);
                        setError(t('pdfViewer.renderError'));
                        setIsLoading(false);
                      }}
                    >
                      <Document
                        file={pdfUrl}
                        onLoadSuccess={handleDocumentLoadSuccess}
                        onLoadError={handleDocumentLoadError}
                        loading={
                          <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
                            {t('pdfViewer.loading')}
                          </div>
                        }
                      >
                        <Page
                          pageNumber={pageNumber}
                          width={renderWidth}
                          renderTextLayer
                          renderAnnotationLayer={false}
                          onRenderError={handleRenderError}
                          loading={
                            <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
                              {t('pdfViewer.loadingPage')}
                            </div>
                          }
                        />
                      </Document>
                    </PdfErrorBoundary>
                  </TransformComponent>
                </div>
                <IonFooter>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 16px',
                      paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 8px))',
                      backgroundColor: '#fff',
                      borderTop: '1px solid #e8e8e8',
                    }}
                  >
                    <IonButton
                      color="primary"
                      onClick={handleShare}
                      disabled={isSaving || !pdfUrl}
                      style={{
                        '--border-radius': '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '14px',
                      }}
                    >
                      <IonIcon icon={shareSocial} slot="start" />
                      {isSaving ? t('pdfViewer.sharing') : t('pdfViewer.share')}
                    </IonButton>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={handlePrevPage}
                        disabled={pageNumber <= 1 || numPages <= 1}
                        style={{ '--color': '#098947' }}
                      >
                        <IonIcon icon={chevronBack} />
                      </IonButton>
                      <span style={{ fontSize: '14px', color: '#333', fontWeight: 600, minWidth: '48px', textAlign: 'center' }}>
                        {numPages > 0 ? t('pdfViewer.pageCounter', { current: pageNumber, total: numPages }) : '-'}
                      </span>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={handleNextPage}
                        disabled={pageNumber >= numPages || numPages <= 1}
                        style={{ '--color': '#098947' }}
                      >
                        <IonIcon icon={chevronForward} />
                      </IonButton>
                    </div>
                  </div>
                </IonFooter>
              </>
            </TransformWrapper>
          )}
        </div>
      </IonContent>
      <Toast
        isOpen={showToast}
        message={toastMessage}
        color={toastColor}
        onDidDismiss={() => setShowToast(false)}
      />
    </IonModal>
  );
};

export default PdfViewerModal;
