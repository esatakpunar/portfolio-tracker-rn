import * as Haptics from 'expo-haptics';

export const hapticFeedback = {
  // Hafif dokunma - buton press, tab değişimi
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  
  // Orta şiddette - item ekleme, düzenleme
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  
  // Ağır - silme, önemli işlemler
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  
  // Başarı - işlem tamamlandı
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  
  // Uyarı - dikkat gerektiren durum
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  
  // Hata - işlem başarısız
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
  
  // Seçim - picker, dropdown
  selection: () => {
    Haptics.selectionAsync();
  },
};
