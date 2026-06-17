import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type jsPDF from 'jspdf';

/**
 * Salva um PDF gerado pelo jsPDF.
 * No nativo (Android/iOS), salva em Documents usando Capacitor Filesystem.
 * No web, usa o download padrão do navegador.
 */
export const savePdf = async (doc: jsPDF, fileName: string): Promise<string | null> => {
  const blob = doc.output('blob');
  return saveBlob(blob, fileName);
};

/**
 * Tenta baixar via navegador como fallback quando o save nativo falha.
 */
export const downloadPdfBlob = (doc: jsPDF, fileName: string): void => {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

async function saveBlob(blob: Blob, fileName: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      return result.uri;
    } catch (error) {
      console.error('Erro ao salvar PDF nativamente:', error);
      throw error;
    }
  } else {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return null;
  }
}
