import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importando os arquivos de tradução
import ptBR from '../locale/pt-BR.json';
import enUS from '../locale/en-US.json';
import esCO from '../locale/es-CO.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-CO': { translation: esCO }
};

// Obtendo o idioma salvo no localStorage ou usando o padrão (es-CO)
const savedLanguage = localStorage.getItem('language') || 'es-CO';

// Garantir que o idioma padrão (espanhol) esteja no localStorage
if (!localStorage.getItem('language')) {
  localStorage.setItem('language', 'es-CO');
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: false,
    parseMissingKeyHandler: (key) => {
      // Retorna "NECESSITA_TRADUCAO" quando a chave não é encontrada
      return 'NECESSITA_TRADUCAO';
    },
    missingKeyNoValueFallbackToKey: false,
    saveMissing: false,
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
