export default {
  portfolio: 'Portfolio',
  portfolioSubtitle: 'Manage your assets',
  history: 'History',
  historySubtitle: 'All your transactions',
  yesterday: 'Yesterday',
  daysAgo: 'days ago',
  settings: 'Settings',
  
  assetTypes: {
    '22_ayar': '22 Carat Gold (gram)',
    '24_ayar': '24 Carat Gold (gram)',
    'ceyrek': 'Quarter Gold',
    'tam': 'Full Gold',
    'usd': 'Dollar (USD)',
    'eur': 'Euro (EUR)',
    'tl': 'Turkish Lira (TL)',
    'gumus': 'Silver (gram)'
  },
  
  currencies: {
    TL: 'Turkish Lira',
    USD: 'US Dollar',
    EUR: 'Euro',
    ALTIN: 'Gold (gram)'
  },
  
  units: {
    piece: 'pcs',
    gram: 'gram'
  },
  
  addNewAsset: 'Add New Asset',
  addNewAssetSubtitle: 'Add a new investment to your portfolio',
  assetType: 'Asset Type',
  selectAssetType: 'Select asset type',
  unit: 'Unit',
  unitPlaceholder: 'Unit (gr, pcs, etc.)',
  amount: 'Amount',
  amountPlaceholder: '0.0000',
  amountToAdd: 'Amount to Add',
  amountToRemove: 'Amount to Remove',
  invalidAmount: 'Invalid amount or exceeds current amount',
  remove: 'Remove',
  description: 'Description',
  optional: '(optional)',
  descriptionPlaceholder: 'You can write a description',
  add: 'Add',
  cancel: 'Cancel',
  ok: 'OK',
  
  confirmDelete: 'Confirm Delete',
  confirmDeleteMessage: 'Are you sure you want to delete this asset from your portfolio?',
  deleteAllConfirm: 'All assets will be deleted. Are you sure?',
  deleteAmount: 'Amount to Delete',
  deleteAllAmount: 'Delete all amount',
  partialDeleteNote: 'Note: If you enter a value less than the total amount, only that much will be deleted.',
  note: 'Note',
  notePlaceholder: 'You can add a note about this transaction',
  delete: 'Delete',
  edit: 'Edit',
  
  editAmount: 'Edit Amount',
  currentAmount: 'Current Amount',
  newAmount: 'New Amount',
  update: 'Update',
  increase: 'Increase',
  decrease: 'Decrease',
  noChange: 'No change',
  
  total: 'Total',
  assets: 'Assets',
  noAssets: 'No assets added yet',
  addFirstAsset: 'Add your first asset',
  
  historyTitle: 'Transaction History',
  noHistory: 'No transaction history yet',
  noHistorySubtitle: 'Your transaction history will appear here',
  
  settingsTitle: 'Settings',
  settingsSubtitle: 'Application settings',
  refreshPrices: 'Refresh Prices',
  refresh: 'Refresh',
  refreshing: 'Refreshing...',
  pullToRefresh: 'Pull down to refresh',
  resetAllData: 'Reset All Data',
  language: 'Language',
  
  itemAdded: 'Asset added successfully',
  itemDeleted: 'Asset deleted successfully',
  pricesRefreshed: 'Prices updated',
  pricesUpdated: 'Prices updated successfully!',
  pricesUpdateFailed: 'Failed to update prices.',
  allDataReset: 'All data has been reset',
  languageChanged: 'Language changed',
  valueCopied: 'Value copied',
  longPressToCopy: 'Long press to copy',
  clipboardNotAvailable: 'Clipboard feature is not available in this environment',
  quickPresets: 'Quick Amounts',
  recentAmounts: 'Recent Amounts',
  
  close: 'Close',
  save: 'Save',
  loading: 'Loading...',
  error: 'An error occurred',
  success: 'Success',
  
  currentMarketPrices: 'Current market prices',
  dangerZone: 'Danger Zone',
  resetAllDataSubtitle: 'Reset all data',
  
  // Financial Disclaimer
  financialDisclaimer: 'Financial Disclaimer',
  priceDataInfo: 'About price information',
  disclaimerText: 'Prices shown in this app are for informational purposes only. It is recommended to seek professional financial advice before making investment decisions. Real-time market data is obtained from finans.truncgil.com API.',
  dataSource: 'Data Source',
  
  // Amount update descriptions
  amountIncreased: 'Amount increased',
  amountDecreased: 'Amount decreased',
  
  // Network status
  offlineMessage: 'No internet connection',
  
  // Error messages
  errorNetwork: 'Network connection issue. Please check your connection.',
  errorTimeout: 'Request timed out. Please try again.',
  errorServer: 'Server error. Please try again later.',
  errorClient: 'An error occurred. Please try again.',
  errorValidation: 'Invalid data. Please check your information.',
  errorUnknown: 'An unexpected error occurred. Please try again.',
  
  // Error Boundary
  errorBoundary: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please restart the app.',
    tryAgain: 'Try Again',
    restartApp: 'Restart App',
    reportError: 'Report Error',
    errorDetails: 'Error Details',
  },
  
  // Validation messages
  validation: {
    amountEmpty: 'Amount cannot be empty',
    amountInvalidFormat: 'Invalid number format',
    amountTooSmall: 'Amount must be greater than 0',
    amountTooLarge: 'Amount is too large',
    amountExceedsLimit: 'Amount exceeds maximum limit',
    amountExceedsCurrent: 'Amount exceeds current amount',
    amountBelowMinimum: 'Amount is below minimum',
    amountAboveMaximum: 'Amount exceeds maximum'
  },
  
  // Privacy & Legal
  privacyPolicy: 'Privacy Policy',
  privacyPolicySubtitle: 'Data protection and privacy information',
  privacy: {
    introduction: 'Introduction',
    introductionText: 'Portfolio Tracker respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard information when you use our mobile application.',
    dataCollection: 'Information We Collect',
    localData: 'Data Stored Locally on Your Device',
    localDataText: 'Our app stores the following information locally on your device:\n• Portfolio Data: Asset types, amounts, descriptions, and transaction history\n• User Preferences: Language selection (Turkish, English, German)\n• Price Data: Market prices fetched from external APIs (cached locally)',
    noDataCollection: 'Information We Do NOT Collect',
    noDataCollectionText: 'We do NOT collect, store, or transmit:\n• Personal identifiable information (name, email, phone number)\n• Device identifiers or advertising IDs\n• Location data\n• Contact information\n• Photos or files',
    dataUsage: 'How We Use Your Information',
    dataUsageText: '• Portfolio data is used solely to calculate and display your investment portfolio value\n• Language preferences are used to customize the app interface\n• Price data is used to provide current market values for your assets\n• Market prices are fetched from finans.truncgil.com API for informational purposes only',
    dataStorage: 'Data Storage and Security',
    dataStorageText: '• All your data is stored locally on your device\n• Data is not transmitted to our servers or any third parties\n• Data remains on your device until you delete the app or use the "Reset All" feature\n• We have no access to your data as it\'s stored locally',
    thirdPartyServices: 'Third-Party Services',
    thirdPartyServicesText: '• We use finans.truncgil.com API to fetch market prices\n• This is a public API that provides financial market data\n• No personal information is shared with this service',
    yourRights: 'Your Rights',
    yourRightsText: 'Since all data is stored locally on your device:\n• You have complete control over your data\n• You can delete your data at any time using the "Reset All" feature\n• You can uninstall the app to remove all data',
    gdprCompliance: 'GDPR Compliance',
    gdprComplianceText: 'This Privacy Policy complies with:\n• Apple App Store Review Guidelines\n• General Data Protection Regulation (GDPR) principles\n• California Consumer Privacy Act (CCPA) requirements\n\nNote: This app does not collect, store, or transmit any personal information. All data remains on your device and is under your complete control.',
    contact: 'Contact Information',
    contactText: 'If you have any questions about this Privacy Policy or our privacy practices, please contact us.',
    lastUpdated: 'Last Updated',
    lastUpdatedDate: 'January 2025'
  }
};
