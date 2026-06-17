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
import { savePdf } from '../utils/saveFile';

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
  const [pdfDataUri, setPdfDataUri] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && doc) {
      setPdfDataUri(doc.output('datauristring'));
    }
  }, [isOpen, doc]);

  const handleDownload = async () => {
    if (!doc) return;
    setIsSaving(true);
    try {
      await savePdf(doc, fileName);
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
        {pdfDataUri ? (
          <iframe
            src={pdfDataUri}
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
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <IonButton fill="outline" onClick={onClose}>
              Fechar
            </IonButton>
            <IonButton
              color="primary"
              onClick={handleDownload}
              disabled={isSaving || !pdfDataUri}
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
