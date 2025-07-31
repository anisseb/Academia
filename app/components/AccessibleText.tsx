import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { useDysFont } from '../hooks/useDysFont';
import { AudioIcon } from './AudioIcon';
import { useTextSimplification, SimplificationResult } from '../services/textSimplificationService';

interface AccessibleTextProps {
  children: string;
  style?: TextStyle | TextStyle[];
  weight?: 'regular' | 'bold';
  italic?: boolean;
  showAudioIcon?: boolean;
  enableSimplification?: boolean;
  originalTextStyle?: TextStyle;
  simplifiedTextStyle?: TextStyle;
  audioIconSize?: number;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  style,
  weight = 'regular',
  italic = false,
  showAudioIcon = true,
  enableSimplification = true,
  originalTextStyle,
  simplifiedTextStyle,
  audioIconSize = 20,
  numberOfLines,
  ellipsizeMode,
}) => {
  const { getDysFontStyle } = useDysFont();
  const { simplifyText, isAutoSimplificationEnabled } = useTextSimplification();
  const [simplificationResult, setSimplificationResult] = useState<SimplificationResult>({
    originalText: children,
    simplifiedText: children,
    isSimplified: false,
  });

  useEffect(() => {
    const processText = async () => {
      if (enableSimplification && isAutoSimplificationEnabled) {
        const result = await simplifyText(children);
        setSimplificationResult(result);
      } else {
        setSimplificationResult({
          originalText: children,
          simplifiedText: children,
          isSimplified: false,
        });
      }
    };

    processText();
  }, [children, enableSimplification, isAutoSimplificationEnabled, simplifyText]);

  const textToDisplay = simplificationResult.simplifiedText;
  const isSimplified = simplificationResult.isSimplified;

  // Appliquer le style DYS
  const baseStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
  const finalStyle = getDysFontStyle(
    isSimplified ? { ...baseStyle, ...simplifiedTextStyle } : { ...baseStyle, ...originalTextStyle },
    weight,
    italic
  );

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text
          style={finalStyle}
          numberOfLines={numberOfLines}
          ellipsizeMode={ellipsizeMode}
        >
          {textToDisplay}
        </Text>
        {showAudioIcon && (
          <AudioIcon
            text={textToDisplay}
            size={audioIconSize}
            simplified={isSimplified}
            style={styles.audioIcon}
          />
        )}
      </View>
      {isSimplified && (
        <View style={styles.simplificationIndicator}>
          <Text style={styles.simplificationText}>
            ✨ Texte simplifié automatiquement
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  audioIcon: {
    marginTop: 2,
  },
  simplificationIndicator: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  simplificationText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '500',
  },
});