import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type jsPDF from 'jspdf';

/**
 * Converte um jsPDF em base64.
 */
async function pdfToBase64(doc: jsPDF): Promise<string> {
  const blob = doc.output('blob');
  const reader = new FileReader();
  return new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(new Error('Erro ao ler PDF como base64'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Salva um PDF gerado pelo jsPDF.
 * No nativo (Android/iOS), salva na pasta pública Documents/cobrarMobile usando Capacitor Filesystem.
 * No web, usa o download padrão do navegador.
 */
export const savePdf = async (doc: jsPDF, fileName: string): Promise<string | null> => {
  const base64Data = await pdfToBase64(doc);
  return saveBase64(base64Data, fileName);
};

async function saveBase64(base64Data: string, fileName: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      // Directory.Documents = pasta pública Documents do dispositivo.
      // No Android 10+ o app só consegue acessar arquivos/pastas que ele próprio criou (scoped storage).
      const result = await Filesystem.writeFile({
        path: `cobrarMobile/${fileName}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      // Retorna um caminho amigável para exibição no toast
      return `/Documents/cobrarMobile/${fileName}`;
    } catch (error) {
      console.error('Erro ao salvar PDF nativamente:', error);
      throw error;
    }
  } else {
    const blob = await (await fetch(`data:application/pdf;base64,${base64Data}`)).blob();
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

/**
 * Compartilha um PDF gerado pelo jsPDF usando a tela nativa de compartilhamento.
 * No nativo, salva em cache e abre o share sheet.
 * No web, tenta usar a Web Share API; se não disponível, faz download.
 */
export const sharePdf = async (doc: jsPDF, fileName: string): Promise<void> => {
  const base64Data = await pdfToBase64(doc);

  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: `share/${fileName}`,
      data: base64Data,
      directory: Directory.Cache,
      recursive: true,
    });

    await Share.share({
      title: fileName,
      files: [result.uri],
      dialogTitle: 'Compartilhar PDF',
    });
    return;
  }

  // Web: tenta Web Share API, senão faz download
  const blob = await (await fetch(`data:application/pdf;base64,${base64Data}`)).blob();
  if (navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'application/pdf' })] })) {
    await navigator.share({
      files: [new File([blob], fileName, { type: 'application/pdf' })],
      title: fileName,
    });
  } else {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
