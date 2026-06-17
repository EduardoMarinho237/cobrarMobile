import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type jsPDF from 'jspdf';

/**
 * Salva um PDF gerado pelo jsPDF.
 * No nativo (Android/iOS), salva em Documents usando Capacitor Filesystem.
 * No web, usa o download padrão do navegador.
 */
export const savePdf = async (doc: jsPDF, fileName: string): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    const dataUri = doc.output('datauristring');
    const base64Data = dataUri.split(',')[1];

    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });

    return result.uri;
  } else {
    doc.save(fileName);
    return null;
  }
};
