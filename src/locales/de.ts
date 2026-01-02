export default {
  portfolio: 'Portfolio',
  portfolioSubtitle: 'Verwalten Sie Ihre Vermögenswerte',
  history: 'Verlauf',
  historySubtitle: 'Alle Ihre Transaktionen',
  yesterday: 'Gestern',
  daysAgo: 'Tage her',
  settings: 'Einstellungen',
  
  assetTypes: {
    '22_ayar': '22 Karat Gold (Gramm)',
    '24_ayar': '24 Karat Gold (Gramm)',
    'ceyrek': 'Viertel Gold',
    'tam': 'Ganzes Gold',
    'usd': 'Dollar (USD)',
    'eur': 'Euro (EUR)',
    'tl': 'Türkische Lira (TL)',
    'gumus': 'Silber (Gramm)'
  },
  
  currencies: {
    TL: 'Türkische Lira',
    USD: 'US-Dollar',
    EUR: 'Euro',
    ALTIN: 'Gold (Gramm)'
  },
  
  units: {
    piece: 'Stück',
    gram: 'Gramm'
  },
  
  addNewAsset: 'Neuen Vermögenswert hinzufügen',
  addNewAssetSubtitle: 'Fügen Sie eine neue Investition zu Ihrem Portfolio hinzu',
  assetType: 'Vermögensart',
  selectAssetType: 'Vermögensart auswählen',
  unit: 'Einheit',
  unitPlaceholder: 'Einheit (gr, Stück, etc.)',
  amount: 'Menge',
  amountPlaceholder: '0.0000',
  amountToAdd: 'Hinzuzufügende Menge',
  amountToRemove: 'Zu entfernende Menge',
  invalidAmount: 'Ungültige Menge oder überschreitet die aktuelle Menge',
  remove: 'Entfernen',
  description: 'Beschreibung',
  optional: '(optional)',
  descriptionPlaceholder: 'Sie können eine Beschreibung schreiben',
  add: 'Hinzufügen',
  cancel: 'Abbrechen',
  ok: 'OK',
  
  confirmDelete: 'Löschen bestätigen',
  confirmDeleteMessage: 'Sind Sie sicher, dass Sie diesen Vermögenswert aus Ihrem Portfolio löschen möchten?',
  deleteAllConfirm: 'Alle Vermögenswerte werden gelöscht. Sind Sie sicher?',
  deleteAmount: 'Zu löschende Menge',
  deleteAllAmount: 'Gesamte Menge löschen',
  partialDeleteNote: 'Hinweis: Wenn Sie einen Wert eingeben, der geringer ist als die Gesamtmenge, wird nur diese Menge gelöscht.',
  note: 'Notiz',
  notePlaceholder: 'Sie können eine Notiz zu dieser Transaktion hinzufügen',
  delete: 'Löschen',
  edit: 'Bearbeiten',
  
  editAmount: 'Menge bearbeiten',
  currentAmount: 'Aktuelle Menge',
  newAmount: 'Neue Menge',
  update: 'Aktualisieren',
  increase: 'Erhöhen',
  decrease: 'Verringern',
  noChange: 'Keine Änderung',
  
  total: 'Gesamt',
  assets: 'Vermögenswerte',
  noAssets: 'Noch keine Vermögenswerte hinzugefügt',
  addFirstAsset: 'Fügen Sie Ihren ersten Vermögenswert hinzu',
  
  historyTitle: 'Transaktionsverlauf',
  noHistory: 'Noch kein Transaktionsverlauf',
  noHistorySubtitle: 'Ihr Transaktionsverlauf wird hier angezeigt',
  
  settingsTitle: 'Einstellungen',
  settingsSubtitle: 'Anwendungseinstellungen',
  refreshPrices: 'Preise aktualisieren',
  refresh: 'Aktualisieren',
  refreshing: 'Wird aktualisiert...',
  pullToRefresh: 'Zum Aktualisieren nach unten ziehen',
  resetAllData: 'Alle Daten zurücksetzen',
  language: 'Sprache',
  
  itemAdded: 'Vermögenswert erfolgreich hinzugefügt',
  itemDeleted: 'Vermögenswert erfolgreich gelöscht',
  pricesRefreshed: 'Preise aktualisiert',
  pricesUpdated: 'Preise erfolgreich aktualisiert!',
  pricesUpdateFailed: 'Fehler beim Aktualisieren der Preise.',
  allDataReset: 'Alle Daten wurden zurückgesetzt',
  languageChanged: 'Sprache geändert',
  
  close: 'Schließen',
  save: 'Speichern',
  loading: 'Laden...',
  error: 'Ein Fehler ist aufgetreten',
  success: 'Erfolgreich',
  
  currentMarketPrices: 'Aktuelle Marktpreise',
  dangerZone: 'Gefahrenbereich',
  resetAllDataSubtitle: 'Alle Daten zurücksetzen',
  
  // Financial Disclaimer
  financialDisclaimer: 'Finanzielle Haftungsausschluss',
  priceDataInfo: 'Über Preisinformationen',
  disclaimerText: 'Die in dieser App angezeigten Preise dienen nur zu Informationszwecken. Es wird empfohlen, professionelle Finanzberatung einzuholen, bevor Sie Investitionsentscheidungen treffen. Echtzeit-Marktdaten werden von der finans.truncgil.com API bezogen.',
  dataSource: 'Datenquelle',
  
  // Amount update descriptions
  amountIncreased: 'Menge erhöht',
  amountDecreased: 'Menge verringert',
  
  // Network status
  offlineMessage: 'Keine Internetverbindung',
  
  // Error messages
  errorNetwork: 'Netzwerkverbindungsproblem. Bitte überprüfen Sie Ihre Verbindung.',
  errorTimeout: 'Anfrage-Zeitüberschreitung. Bitte versuchen Sie es erneut.',
  errorServer: 'Serverfehler. Bitte versuchen Sie es später erneut.',
  errorClient: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  errorValidation: 'Ungültige Daten. Bitte überprüfen Sie Ihre Informationen.',
  errorUnknown: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
  
  // Error Boundary
  errorBoundary: {
    title: 'Etwas ist schief gelaufen',
    message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte starten Sie die App neu.',
    tryAgain: 'Erneut versuchen',
    restartApp: 'App neu starten',
    reportError: 'Fehler melden',
    errorDetails: 'Fehlerdetails',
  },
  
  // Validation messages
  validation: {
    amountEmpty: 'Betrag darf nicht leer sein',
    amountInvalidFormat: 'Ungültiges Zahlenformat',
    amountTooSmall: 'Betrag muss größer als 0 sein',
    amountTooLarge: 'Betrag ist zu groß',
    amountExceedsLimit: 'Betrag überschreitet das Maximum',
    amountExceedsCurrent: 'Betrag überschreitet den aktuellen Betrag',
    amountBelowMinimum: 'Betrag liegt unter dem Minimum',
    amountAboveMaximum: 'Betrag überschreitet das Maximum'
  },
  
  // Privacy & Legal
  privacyPolicy: 'Datenschutzerklärung',
  privacyPolicySubtitle: 'Datenschutz- und Datenschutzinformationen',
  privacy: {
    introduction: 'Einführung',
    introductionText: 'Portfolio Tracker respektiert Ihre Privatsphäre und ist dem Schutz Ihrer persönlichen Informationen verpflichtet. Diese Datenschutzerklärung erläutert, wie wir Informationen sammeln, verwenden und schützen, wenn Sie unsere mobile Anwendung verwenden.',
    dataCollection: 'Informationen, die wir sammeln',
    localData: 'Lokal auf Ihrem Gerät gespeicherte Daten',
    localDataText: 'Unsere App speichert die folgenden Informationen lokal auf Ihrem Gerät:\n• Portfoliodaten: Vermögensarten, Beträge, Beschreibungen und Transaktionsverlauf\n• Benutzereinstellungen: Sprachauswahl (Türkisch, Englisch, Deutsch)\n• Preisdaten: Von externen APIs abgerufene Marktpreise (lokal zwischengespeichert)',
    noDataCollection: 'Informationen, die wir NICHT sammeln',
    noDataCollectionText: 'Wir sammeln, speichern oder übertragen NICHT:\n• Persönlich identifizierbare Informationen (Name, E-Mail, Telefonnummer)\n• Geräte-IDs oder Werbe-IDs\n• Standortdaten\n• Kontaktinformationen\n• Fotos oder Dateien',
    dataUsage: 'Wie wir Ihre Informationen verwenden',
    dataUsageText: '• Portfoliodaten werden ausschließlich zur Berechnung und Anzeige Ihres Anlageportfoliowerts verwendet\n• Spracheinstellungen werden zur Anpassung der App-Oberfläche verwendet\n• Preisdaten werden zur Bereitstellung aktueller Marktwerte für Ihre Vermögenswerte verwendet\n• Marktpreise werden von der finans.truncgil.com API nur zu Informationszwecken abgerufen',
    dataStorage: 'Datenspeicherung und Sicherheit',
    dataStorageText: '• Alle Ihre Daten werden lokal auf Ihrem Gerät gespeichert\n• Daten werden nicht an unsere Server oder Dritte übertragen\n• Daten bleiben auf Ihrem Gerät, bis Sie die App löschen oder die Funktion "Alles zurücksetzen" verwenden\n• Wir haben keinen Zugriff auf Ihre Daten, da sie lokal gespeichert sind',
    thirdPartyServices: 'Drittanbieter-Dienste',
    thirdPartyServicesText: '• Wir verwenden die finans.truncgil.com API, um Marktpreise abzurufen\n• Dies ist eine öffentliche API, die Finanzmarktdaten bereitstellt\n• Es werden keine persönlichen Informationen mit diesem Dienst geteilt',
    yourRights: 'Ihre Rechte',
    yourRightsText: 'Da alle Daten lokal auf Ihrem Gerät gespeichert sind:\n• Sie haben vollständige Kontrolle über Ihre Daten\n• Sie können Ihre Daten jederzeit mit der Funktion "Alles zurücksetzen" löschen\n• Sie können die App deinstallieren, um alle Daten zu entfernen',
    gdprCompliance: 'DSGVO-Konformität',
    gdprComplianceText: 'Diese Datenschutzerklärung entspricht:\n• Apple App Store Review-Richtlinien\n• Grundsätzen der Datenschutz-Grundverordnung (DSGVO)\n• Anforderungen des California Consumer Privacy Act (CCPA)\n\nHinweis: Diese App sammelt, speichert oder überträgt keine persönlichen Informationen. Alle Daten bleiben auf Ihrem Gerät und stehen unter Ihrer vollständigen Kontrolle.',
    contact: 'Kontaktinformationen',
    contactText: 'Wenn Sie Fragen zu dieser Datenschutzerklärung oder unseren Datenschutzpraktiken haben, kontaktieren Sie uns bitte.',
    lastUpdated: 'Zuletzt aktualisiert',
    lastUpdatedDate: 'Januar 2025'
  }
};
