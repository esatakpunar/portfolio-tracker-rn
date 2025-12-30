module.exports = function(api) {
  api.cache(true);
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Production'da console.log/error/warn'ları kaldır
      // Development'ta logger service kullanıyoruz, bu yüzden sadece production'da aktif
      // Logger service zaten production'da console'a yazmıyor, bu ekstra güvenlik için
      ...(isProduction
        ? [['transform-remove-console', { exclude: ['error'] }]] 
        : []
      ),
    ],
  };
};

