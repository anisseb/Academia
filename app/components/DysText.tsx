import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';

interface DysTextProps extends TextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}

export const DysText: React.FC<DysTextProps> = ({ children, style, ...props }) => {
  const { isDyslexicFontEnabled } = useAccessibility();

  const getFontFamily = (baseStyle?: TextStyle | TextStyle[]): string => {
    if (!isDyslexicFontEnabled) {
      return '';
    }

    // Vérifier si le style contient fontWeight pour utiliser la bonne variante
    const styles = Array.isArray(baseStyle) ? baseStyle : [baseStyle];
    const hasBoldWeight = styles.some(s => 
      s && (s.fontWeight === 'bold' || 
            s.fontWeight === '600' || 
            s.fontWeight === '700' || 
            s.fontWeight === '800' || 
            s.fontWeight === '900')
    );

    return hasBoldWeight ? 'OpenDyslexic-Bold' : 'OpenDyslexic';
  };

  const fontFamily = getFontFamily(style);
  const dysStyle = fontFamily ? { fontFamily } : {};

  return (
    <Text 
      {...props} 
      style={[style, dysStyle]}
    >
      {children}
    </Text>
  );
};

// Exporter aussi un hook pour l'utiliser avec des styles personnalisés
export const useDysFont = () => {
  const { isDyslexicFontEnabled } = useAccessibility();
  
  return {
    getDysTextStyle: (isBold: boolean = false): TextStyle => {
      if (!isDyslexicFontEnabled) {
        return {};
      }
      return {
        fontFamily: isBold ? 'OpenDyslexic-Bold' : 'OpenDyslexic'
      };
    }
  };
};