import React from 'react';
import { TextInput as RNTextInput, TextInputProps } from 'react-native';

/**
 * Global TextInput component wrapper
 * iOS Dynamic Type'ı devre dışı bırakarak UI bozulmalarını önler
 * Tüm TextInput component'leri bu wrapper'ı kullanmalı
 */
export const TextInput: React.FC<TextInputProps> = ({ style, allowFontScaling = false, ...props }) => {
  return (
    <RNTextInput
      {...props}
      style={style}
      allowFontScaling={allowFontScaling} // iOS Dynamic Type'ı devre dışı bırak
    />
  );
};

export default TextInput;

