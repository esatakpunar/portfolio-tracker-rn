import React from 'react';
import { Text as RNText, TextProps } from 'react-native';

/**
 * Global Text component wrapper
 * iOS Dynamic Type'ı devre dışı bırakarak UI bozulmalarını önler
 * Tüm Text component'leri bu wrapper'ı kullanmalı
 */
export const Text: React.FC<TextProps> = ({ style, allowFontScaling = false, ...props }) => {
  return (
    <RNText
      {...props}
      style={style}
      allowFontScaling={allowFontScaling} // iOS Dynamic Type'ı devre dışı bırak
    />
  );
};

export default Text;

