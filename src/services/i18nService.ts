/**
 * Internationalization Service
 * Provides multilingual support for the application
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ar';

interface Translation {
  [key: string]: string | Translation;
}

interface Translations {
  [lang: string]: Translation;
}

const translations: Translations = {
  en: {
    common: {
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
    },
    search: {
      placeholder: 'Search for educational content...',
      voiceSearch: 'Voice Search',
      advancedFilters: 'Advanced Filters',
      results: 'results',
      noResults: 'No results found',
      aiAnswer: 'AI Answer',
      webResults: 'Web Results',
      export: 'Export Results',
      bookmark: 'Bookmark',
    },
    filters: {
      dateRange: 'Date Range',
      contentType: 'Content Type',
      sources: 'Sources',
      category: 'Category',
      all: 'All',
      educational: 'Educational',
      news: 'News',
      reference: 'Reference',
    },
    auth: {
      signIn: 'Sign In',
      signOut: 'Sign Out',
      welcome: 'Welcome',
      student: 'Student',
      staff: 'Staff',
      guest: 'Guest',
    },
  },
  es: {
    common: {
      search: 'Buscar',
      loading: 'Cargando...',
      error: 'Error',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      yes: 'Sí',
      no: 'No',
    },
    search: {
      placeholder: 'Buscar contenido educativo...',
      voiceSearch: 'Búsqueda por Voz',
      advancedFilters: 'Filtros Avanzados',
      results: 'resultados',
      noResults: 'No se encontraron resultados',
      aiAnswer: 'Respuesta IA',
      webResults: 'Resultados Web',
      export: 'Exportar Resultados',
      bookmark: 'Marcar',
    },
    filters: {
      dateRange: 'Rango de Fechas',
      contentType: 'Tipo de Contenido',
      sources: 'Fuentes',
      category: 'Categoría',
      all: 'Todos',
      educational: 'Educativo',
      news: 'Noticias',
      reference: 'Referencia',
    },
    auth: {
      signIn: 'Iniciar Sesión',
      signOut: 'Cerrar Sesión',
      welcome: 'Bienvenido',
      student: 'Estudiante',
      staff: 'Personal',
      guest: 'Invitado',
    },
  },
  fr: {
    common: {
      search: 'Rechercher',
      loading: 'Chargement...',
      error: 'Erreur',
      retry: 'Réessayer',
      cancel: 'Annuler',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      yes: 'Oui',
      no: 'Non',
    },
    search: {
      placeholder: 'Rechercher du contenu éducatif...',
      voiceSearch: 'Recherche Vocale',
      advancedFilters: 'Filtres Avancés',
      results: 'résultats',
      noResults: 'Aucun résultat trouvé',
      aiAnswer: 'Réponse IA',
      webResults: 'Résultats Web',
      export: 'Exporter les Résultats',
      bookmark: 'Marquer',
    },
    filters: {
      dateRange: 'Plage de Dates',
      contentType: 'Type de Contenu',
      sources: 'Sources',
      category: 'Catégorie',
      all: 'Tous',
      educational: 'Éducatif',
      news: 'Actualités',
      reference: 'Référence',
    },
    auth: {
      signIn: 'Se Connecter',
      signOut: 'Se Déconnecter',
      welcome: 'Bienvenue',
      student: 'Étudiant',
      staff: 'Personnel',
      guest: 'Invité',
    },
  },
  de: {
    common: {
      search: 'Suchen',
      loading: 'Laden...',
      error: 'Fehler',
      retry: 'Wiederholen',
      cancel: 'Abbrechen',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      close: 'Schließen',
      yes: 'Ja',
      no: 'Nein',
    },
    search: {
      placeholder: 'Suche nach Bildungsinhalten...',
      voiceSearch: 'Sprachsuche',
      advancedFilters: 'Erweiterte Filter',
      results: 'Ergebnisse',
      noResults: 'Keine Ergebnisse gefunden',
      aiAnswer: 'KI-Antwort',
      webResults: 'Web-Ergebnisse',
      export: 'Ergebnisse Exportieren',
      bookmark: 'Lesezeichen',
    },
    filters: {
      dateRange: 'Datumsbereich',
      contentType: 'Inhaltstyp',
      sources: 'Quellen',
      category: 'Kategorie',
      all: 'Alle',
      educational: 'Bildung',
      news: 'Nachrichten',
      reference: 'Referenz',
    },
    auth: {
      signIn: 'Anmelden',
      signOut: 'Abmelden',
      welcome: 'Willkommen',
      student: 'Student',
      staff: 'Personal',
      guest: 'Gast',
    },
  },
  zh: {
    common: {
      search: '搜索',
      loading: '加载中...',
      error: '错误',
      retry: '重试',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      close: '关闭',
      yes: '是',
      no: '否',
    },
    search: {
      placeholder: '搜索教育内容...',
      voiceSearch: '语音搜索',
      advancedFilters: '高级筛选',
      results: '结果',
      noResults: '未找到结果',
      aiAnswer: 'AI 回答',
      webResults: '网络结果',
      export: '导出结果',
      bookmark: '书签',
    },
    filters: {
      dateRange: '日期范围',
      contentType: '内容类型',
      sources: '来源',
      category: '类别',
      all: '全部',
      educational: '教育',
      news: '新闻',
      reference: '参考',
    },
    auth: {
      signIn: '登录',
      signOut: '退出',
      welcome: '欢迎',
      student: '学生',
      staff: '员工',
      guest: '访客',
    },
  },
  ar: {
    common: {
      search: 'بحث',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      retry: 'إعادة المحاولة',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      close: 'إغلاق',
      yes: 'نعم',
      no: 'لا',
    },
    search: {
      placeholder: 'البحث عن محتوى تعليمي...',
      voiceSearch: 'البحث الصوتي',
      advancedFilters: 'فلاتر متقدمة',
      results: 'نتائج',
      noResults: 'لم يتم العثور على نتائج',
      aiAnswer: 'إجابة الذكاء الاصطناعي',
      webResults: 'نتائج الويب',
      export: 'تصدير النتائج',
      bookmark: 'إضافة إلى المفضلة',
    },
    filters: {
      dateRange: 'نطاق التاريخ',
      contentType: 'نوع المحتوى',
      sources: 'المصادر',
      category: 'الفئة',
      all: 'الكل',
      educational: 'تعليمي',
      news: 'أخبار',
      reference: 'مرجع',
    },
    auth: {
      signIn: 'تسجيل الدخول',
      signOut: 'تسجيل الخروج',
      welcome: 'مرحباً',
      student: 'طالب',
      staff: 'موظف',
      guest: 'ضيف',
    },
  },
};

class I18nService {
  private currentLang: SupportedLanguage = 'en';
  private listeners: Array<(lang: SupportedLanguage) => void> = [];

  constructor() {
    // Get saved language or browser language
    const saved = localStorage.getItem('language') as SupportedLanguage;
    const browserLang = navigator.language.split('-')[0] as SupportedLanguage;

    this.currentLang = saved || (this.isSupported(browserLang) ? browserLang : 'en');
    this.applyDirection();
  }

  private isSupported(lang: string): lang is SupportedLanguage {
    return ['en', 'es', 'fr', 'de', 'zh', 'ar'].includes(lang);
  }

  private applyDirection() {
    // Set text direction for RTL languages
    const isRTL = this.currentLang === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = this.currentLang;
  }

  setLanguage(lang: SupportedLanguage) {
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    this.applyDirection();
    this.notifyListeners();
  }

  getLanguage(): SupportedLanguage {
    return this.currentLang;
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLang];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  }

  t = this.translate.bind(this);

  getAllLanguages(): Array<{ code: SupportedLanguage; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    ];
  }

  subscribe(callback: (lang: SupportedLanguage) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => callback(this.currentLang));
  }

  isRTL(): boolean {
    return this.currentLang === 'ar';
  }
}

export const i18nService = new I18nService();
export default i18nService;
