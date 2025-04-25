import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';
import './formules.css';

interface MathTextProps {
  content: string;
  type?: 'question' | 'option' | 'explanation' | 'cours';
  isDarkMode: boolean;
}

const styles = StyleSheet.create({
  questionText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
  },
  explanationText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  coursText: {
    color: '#ffffff',
    fontSize: 16,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  mathContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 1,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 1,
  },
  textPart: {
    fontSize: 16,
  },
  mathPart: {
    flexGrow: 0,
    flexShrink: 1,
    marginHorizontal: 2,
  }
});

const MathText: React.FC<MathTextProps> = ({ content, type = 'cours', isDarkMode }) => {
  if (!content) {
    return <Text>-</Text>;
  }

  const textColor = isDarkMode ? '#ffffff' : '#000000';
  
  return (
    <MathJaxSvg
      fontSize={16}
      color={textColor}
      fontCache={true}
      style={styles.mathPart}
    >
      {content.replace(/\\\\/g, '\\')}
    </MathJaxSvg>
  );
};

export const renderMathText = MathText;