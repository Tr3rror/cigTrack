import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      settings: "Settings",
      features: "Features",
      homeStats: "Home Statistics",
      saveSlot: "SAVE TO SLOT",
      reset: "RESTORE THEME",
      language: "Language",
      timeFormat: "Time Format",
      comments: "Comments",
      longCigs: "Long Cigarettes",
      dayChange: "Day Change",
      manual: "Manual",
      auto: "Automatic",
      peak: "Peak Period",
      tot7d: "7d Total",
      avg7d: "7d Avg",
      totMonth: "Month Total",
      avgMonth: "Month Avg",
      primary: "Primary",
      bg: "Background",
      accent: "Accent",
      card: "Card",
      text: "Text",
      // Home & Index
      cigMode: "🚬 Cigarettes",
      otherMode: "✨ Other",
      cigTitle: "CIGARETTES 🚬",
      otherTitle: "OTHER ✨",
      analysisTitle: "Period Analysis",
      analysisSub: "Choose a range and see peaks",
      peak7d: "7D PEAK",
      night: "NIGHT",
      morning: "MORNING",
      afternoon: "AFTERNOON",
      evening: "EVENING",
      registerBtn: "REGISTER SESSION",
      lastAt: "Last at",
      noneToday: "No sessions today",
      manualLabel: "MANUAL",
      notePlaceholder: "Session note...",
      // Missing keys added below
      appearance: "Appearance",
      slots: "Theme Slots",
      empty: "Empty",
      lang: "Language",
      timeFmt: "Time Format",
      commentsSub: "Enable comments on logs",
      longCigsSub: "Increase fill limit to 120%",
      peakSub: "Show peak period in stats"
    }
  },
  it: {
    translation: {
      settings: "Impostazioni",
      features: "Funzionalità",
      homeStats: "Statistiche Home",
      saveSlot: "SALVA IN SLOT",
      reset: "RIPRISTINA TEMA",
      language: "Lingua",
      timeFormat: "Formato Orario",
      comments: "Commenti",
      longCigs: "Sigarette Lunghe",
      dayChange: "Cambio Giorno",
      manual: "Manuale",
      auto: "Automatico",
      peak: "Periodo di Picco",
      tot7d: "Tot 7gg",
      avg7d: "Media 7gg",
      totMonth: "Tot Mese",
      avgMonth: "Media Mese",
      primary: "Primario",
      bg: "Sfondo",
      accent: "Accento",
      card: "Scheda",
      text: "Testo",
      // Home & Index
      cigMode: "🚬 Sigarette",
      otherMode: "✨ Altro",
      cigTitle: "SIGARETTE 🚬",
      otherTitle: "ALTRO ✨",
      analysisTitle: "Analisi Periodo",
      analysisSub: "Scegli un intervallo e vedi i picchi",
      peak7d: "PICCO 7GG",
      night: "NOTTE",
      morning: "MATTINA",
      afternoon: "POMERIGGIO",
      evening: "SERA",
      registerBtn: "REGISTRA SESSIONE",
      lastAt: "Ultima alle",
      noneToday: "Nessuna sessione oggi",
      manualLabel: "MANUALE",
      notePlaceholder: "Nota sessione...",
      // Missing keys added below
      appearance: "Aspetto",
      slots: "Slot Temi",
      empty: "Vuoto",
      lang: "Lingua",
      timeFmt: "Formato Orario",
      commentsSub: "Abilita commenti sui log",
      longCigsSub: "Aumenta riempimento al 120%",
      peakSub: "Mostra periodo di picco"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'it', 
  interpolation: { escapeValue: false }
});

export default i18n;
