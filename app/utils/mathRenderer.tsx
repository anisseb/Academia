import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';

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
    minHeight: 20,
    width: '100%',
  },
  mathContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});

const MathText: React.FC<MathTextProps> = ({ content, type = 'cours', isDarkMode }) => {
  if (!content) {
    return <Text>-</Text>;
  }

  if (!content.includes('$')) {
    return (
      <Text style={[
        type === 'question' && styles.questionText,
        type === 'option' && styles.optionText,
        type === 'explanation' && styles.explanationText,
        type === 'cours' && styles.coursText
      ]}>
        {content}
      </Text>
    );
  }

  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const parts = content.split(/(\$.*?\$)/g);

  return (
    <View style={styles.mathContainer}>
      {parts.map((part, index) => {
          return (
            <MathJaxSvg
              key={index}
              fontSize={16}
              color={textColor}
              fontCache={false}
            >
              {`${part.replace(/\\\\/g, '\\')}`}
            </MathJaxSvg>
          );
      })}
    </View>
  );
};

// Exporter le composant
export const renderMathText = MathText; 