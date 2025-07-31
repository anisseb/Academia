import { useAccessibility } from '../context/AccessibilityContext';
import { TextStyle } from 'react-native';

export const useDysFont = () => {
  const { settings } = useAccessibility();

  const getDysFontStyle = (
    style?: TextStyle,
    weight: 'regular' | 'bold' = 'regular',
    italic: boolean = false
  ): TextStyle => {
    if (!settings.isDysLexicFontEnabled) {
      return style || {};
    }

    let fontFamily = 'OpenDyslexic-Regular';
    
    if (weight === 'bold' && italic) {
      fontFamily = 'OpenDyslexic-BoldItalic';
    } else if (weight === 'bold') {
      fontFamily = 'OpenDyslexic-Bold';
    } else if (italic) {
      fontFamily = 'OpenDyslexic-Italic';
    }

    return {
      ...style,
      fontFamily,
      // Ajuster légèrement la taille pour une meilleure lisibilité avec OpenDyslexic
      fontSize: style?.fontSize ? style.fontSize * 1.05 : undefined,
    };
  };

  return {
    getDysFontStyle,
    isDysLexicFontEnabled: settings.isDysLexicFontEnabled,
  };
};