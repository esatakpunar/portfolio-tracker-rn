module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Production'da console.log/error/warn'ları kaldır
      // Development'ta logger service kullanıyoruz, bu yüzden sadece production'da aktif
      // Logger service zaten production'da console'a yazmıyor, bu ekstra güvenlik için
      ...(process.env.NODE_ENV === 'production' || !__DEV__
        ? [['transform-remove-console', { exclude: ['error'] }]] 
        : []
      ),
    ],
  };
};

