export default {
  portfolio: 'Portföy',
  portfolioSubtitle: 'Varlıklarınızı yönetin',
  history: 'Geçmiş',
  historySubtitle: 'Tüm işlemleriniz',
  yesterday: 'Dün',
  daysAgo: 'gün önce',
  settings: 'Ayarlar',
  
  assetTypes: {
    '22_ayar': 'Gram Altın (22 Ayar)',
    '24_ayar': 'Gram Altın (24 Ayar)',
    'ceyrek': 'Çeyrek Altın',
    'tam': 'Tam Altın',
    'usd': 'Dolar (USD)',
    'eur': 'Euro (EUR)',
    'tl': 'Türk Lirası (TL)',
    'gumus': 'Gümüş (gram)'
  },
  
  currencies: {
    TL: 'Türk Lirası',
    USD: 'Dolar (USD)',
    EUR: 'Euro (EUR)',
    ALTIN: 'Altın (gram)'
  },
  
  units: {
    piece: 'adet',
    gram: 'gram'
  },
  
  addNewAsset: 'Yeni Varlık Ekle',
  addNewAssetSubtitle: 'Portföyünüze yeni bir yatırım ekleyin',
  assetType: 'Varlık Türü',
  selectAssetType: 'Varlık türünü seçin',
  unit: 'Birim',
  unitPlaceholder: 'Birim (gr, adet vb.)',
  amount: 'Miktar',
  amountPlaceholder: '0.0000',
  amountToAdd: 'Eklenecek Miktar',
  amountToRemove: 'Çıkarılacak Miktar',
  invalidAmount: 'Geçersiz miktar veya mevcut miktardan fazla',
  remove: 'Çıkar',
  description: 'Açıklama',
  optional: '(opsiyonel)',
  descriptionPlaceholder: 'Açıklama yazabilirsiniz',
  add: 'Ekle',
  cancel: 'İptal',
  
  confirmDelete: 'Silmeyi Onayla',
  confirmDeleteMessage: 'Bu varlığı portföyünüzden silmek istediğinizden emin misiniz?',
  deleteAllConfirm: 'Tüm varlık silinecek. Emin misiniz?',
  deleteAmount: 'Silinecek Miktar',
  deleteAllAmount: 'Tüm miktarı sil',
  partialDeleteNote: 'Not: Toplam miktardan daha az bir değer girerseniz, sadece o kadarı silinir.',
  note: 'Not',
  notePlaceholder: 'İşlemle ilgili not ekleyebilirsiniz',
  delete: 'Sil',
  edit: 'Düzenle',
  
  editAmount: 'Miktar Düzenle',
  currentAmount: 'Mevcut Miktar',
  newAmount: 'Yeni Miktar',
  update: 'Güncelle',
  increase: 'Artış',
  decrease: 'Azalış',
  noChange: 'Değişiklik yok',
  
  total: 'Toplam',
  assets: 'Varlıklar',
  noAssets: 'Henüz varlık eklenmemiş',
  addFirstAsset: 'İlk varlığınızı ekleyin',
  
  historyTitle: 'İşlem Geçmişi',
  noHistory: 'Henüz işlem geçmişi yok',
  noHistorySubtitle: 'İşlem geçmişiniz burada görünecek',
  
  settingsTitle: 'Ayarlar',
  settingsSubtitle: 'Uygulama ayarları',
  refreshPrices: 'Fiyatları Yenile',
  refresh: 'Yenile',
  resetAllData: 'Tüm Verileri Sıfırla',
  language: 'Dil',
  
  itemAdded: 'Varlık başarıyla eklendi',
  itemDeleted: 'Varlık başarıyla silindi',
  pricesRefreshed: 'Fiyatlar güncellendi',
  pricesUpdated: 'Fiyatlar başarıyla güncellendi!',
  pricesUpdateFailed: 'Fiyatlar güncellenirken hata oluştu.',
  allDataReset: 'Tüm veriler sıfırlandı',
  languageChanged: 'Dil değiştirildi',
  
  close: 'Kapat',
  save: 'Kaydet',
  loading: 'Yükleniyor...',
  error: 'Hata oluştu',
  success: 'Başarılı',
  somethingWentWrong: 'Bir şeyler yanlış gitti',
  tryAgain: 'Tekrar Dene',
  
  currentMarketPrices: 'Güncel piyasa fiyatları',
  dangerZone: 'Tehlikeli Bölge',
  resetAllDataSubtitle: 'Tüm verileri sıfırla',
  
  // Financial Disclaimer
  financialDisclaimer: 'Finansal Uyarı',
  priceDataInfo: 'Fiyat bilgileri hakkında',
  disclaimerText: 'Bu uygulamada gösterilen fiyatlar sadece bilgilendirme amaçlıdır. Yatırım kararlarınızı vermeden önce profesyonel finansal danışmanlık almanız önerilir. Gerçek zamanlı piyasa verileri finans.truncgil.com API\'sinden alınmaktadır.',
  dataSource: 'Veri Kaynağı',
  
  // Amount update descriptions
  amountIncreased: 'Miktar artırıldı',
  amountDecreased: 'Miktar azaltıldı',
  
  // Network status
  offlineMessage: 'İnternet bağlantısı yok',
  
  // Error messages
  errorNetwork: 'İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin.',
  errorTimeout: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
  errorServer: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  errorClient: 'Bir hata oluştu. Lütfen tekrar deneyin.',
  errorValidation: 'Geçersiz veri. Lütfen bilgilerinizi kontrol edin.',
  errorUnknown: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
  
  // Validation messages
  validation: {
    amountEmpty: 'Miktar boş olamaz',
    amountInvalidFormat: 'Geçersiz sayı formatı',
    amountTooSmall: 'Miktar 0\'dan büyük olmalıdır',
    amountTooLarge: 'Miktar çok büyük',
    amountExceedsLimit: 'Miktar maksimum limiti aşıyor',
    amountExceedsCurrent: 'Miktar mevcut miktardan fazla',
    amountBelowMinimum: 'Miktar minimum değerin altında',
    amountAboveMaximum: 'Miktar maksimum değeri aşıyor'
  },
  
  // Privacy & Legal
  privacyPolicy: 'Gizlilik Politikası',
  privacyPolicySubtitle: 'Veri koruma ve gizlilik bilgileri',
  privacy: {
    introduction: 'Giriş',
    introductionText: 'Portfolio Tracker gizliliğinize saygı duyar ve kişisel bilgilerinizi korumaya kararlıdır. Bu Gizlilik Politikası, mobil uygulamamızı kullandığınızda bilgileri nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar.',
    dataCollection: 'Toplanan Bilgiler',
    localData: 'Cihazınızda Yerel Olarak Saklanan Veriler',
    localDataText: 'Uygulamamız aşağıdaki bilgileri cihazınızda yerel olarak saklar:\n• Portföy Verileri: Varlık türleri, miktarlar, açıklamalar ve işlem geçmişi\n• Kullanıcı Tercihleri: Dil seçimi (Türkçe, İngilizce, Almanca)\n• Fiyat Verileri: Harici API\'lerden alınan piyasa fiyatları (yerel olarak önbelleğe alınır)',
    noDataCollection: 'Toplanmayan Bilgiler',
    noDataCollectionText: 'Aşağıdaki bilgileri toplamıyor, saklamıyor veya iletmiyoruz:\n• Kişisel tanımlayıcı bilgiler (isim, e-posta, telefon)\n• Cihaz tanımlayıcıları veya reklam kimlikleri\n• Konum verileri\n• İletişim bilgileri\n• Fotoğraflar veya dosyalar',
    dataUsage: 'Bilgilerin Kullanımı',
    dataUsageText: '• Portföy verileri yalnızca yatırım portföy değerinizi hesaplamak ve göstermek için kullanılır\n• Dil tercihleri uygulama arayüzünü özelleştirmek için kullanılır\n• Fiyat verileri varlıklarınız için güncel piyasa değerleri sağlamak için kullanılır\n• Piyasa fiyatları finans.truncgil.com API\'sinden alınır ve yalnızca bilgilendirme amaçlıdır',
    dataStorage: 'Veri Depolama ve Güvenlik',
    dataStorageText: '• Tüm verileriniz cihazınızda yerel olarak saklanır\n• Veriler sunucularımıza veya üçüncü taraflara iletilmez\n• Veriler, uygulamayı silene veya "Tümünü Sıfırla" özelliğini kullanana kadar cihazınızda kalır\n• Verilerinize erişimimiz yoktur çünkü yerel olarak saklanır',
    thirdPartyServices: 'Üçüncü Taraf Hizmetler',
    thirdPartyServicesText: '• Piyasa fiyatları için finans.truncgil.com API\'sini kullanıyoruz\n• Bu, finansal piyasa verileri sağlayan bir kamu API\'sidir\n• Bu hizmetle hiçbir kişisel bilgi paylaşılmaz',
    yourRights: 'Haklarınız',
    yourRightsText: 'Tüm veriler cihazınızda yerel olarak saklandığı için:\n• Verileriniz üzerinde tam kontrolünüz vardır\n• "Tümünü Sıfırla" özelliğini kullanarak verilerinizi istediğiniz zaman silebilirsiniz\n• Uygulamayı kaldırarak tüm verileri kaldırabilirsiniz',
    gdprCompliance: 'GDPR Uyumluluğu',
    gdprComplianceText: 'Bu Gizlilik Politikası şunlara uygundur:\n• Apple App Store İnceleme Yönergeleri\n• Genel Veri Koruma Yönetmeliği (GDPR) ilkeleri\n• California Tüketici Gizlilik Yasası (CCPA) gereksinimleri\n\nNot: Bu uygulama hiçbir kişisel bilgi toplamaz, saklamaz veya iletmez. Tüm veriler cihazınızda kalır ve tam kontrolünüz altındadır.',
    contact: 'İletişim',
    contactText: 'Bu Gizlilik Politikası veya gizlilik uygulamalarımız hakkında sorularınız varsa, lütfen bizimle iletişime geçin.',
    lastUpdated: 'Son Güncelleme',
    lastUpdatedDate: 'Ocak 2025'
  }
};
