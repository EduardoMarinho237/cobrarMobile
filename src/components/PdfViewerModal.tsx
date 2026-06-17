import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonFooter,
} from '@ionic/react';
import { close, download } from 'ionicons/icons';
import type jsPDF from 'jspdf';
import { savePdf, downloadPdfBlob } from '../utils/saveFile';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: jsPDF | null;
  fileName: string;
  title?: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  doc,
  fileName,
  title = 'Visualizar PDF',
}) => {
  const [pdfUrl, setPdfUrl] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState('');

  React.useEffect(() => {
    if (isOpen && doc) {
      try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error('Erro ao criar blob URL:', err);
      }
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, doc]);

  React.useEffect(() => {
    if (!isOpen) {
      setSaveMessage('');
    }
  }, [isOpen]);

  const handleDownload = async () => {
    if (!doc) return;
    setIsSaving(true);
    setSaveMessage('');
    try {
      const savedUri = await savePdf(doc, fileName);
      if (savedUri) {
        setSaveMessage('PDF salvo em: ' + savedUri);
      } else {
        setSaveMessage('Download concluído');
      }
    } catch (err) {
      console.error('Erro ao salvar PDF:', err);
      try {
        downloadPdfBlob(doc, fileName);
        setSaveMessage('Download via navegador concluído');
      } catch (fallbackErr) {
        console.error('Erro no fallback:', fallbackErr);
        setSaveMessage('Erro ao salvar PDF');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="pdf-viewer-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-no-padding">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="PDF Viewer"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        ) : (
          <div style={{ padding: '32px', textAlign: 'center' }}>Carregando PDF...</div>
        )}
      </IonContent>
      <IonFooter>
        <IonToolbar style={{ padding: '8px 16px' }}>
          {saveMessage && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: saveMessage.includes('Erro') ? '#dc3545' : '#28a745', marginBottom: '8px' }}>
              {saveMessage}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <IonButton fill="outline" onClick={onClose}>
              Fechar
            </IonButton>
            <IonButton
              color="primary"
              onClick={handleDownload}
              disabled={isSaving || !pdfUrl}
            >
              <IonIcon icon={download} slot="start" />
              {isSaving ? 'Salvando...' : 'Baixar PDF'}
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default PdfViewerModal;
