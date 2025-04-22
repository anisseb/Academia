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
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  mathContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textPart: {
    fontSize: 16,
  },
  mathPart: {
    width: '100%',
    height: 'auto',
    marginHorizontal: 0,
  }
});

const MathText: React.FC<MathTextProps> = ({ content, type = 'cours', isDarkMode }) => {
  if (!content) {
    return <Text>-</Text>;
  }

  const textColor = isDarkMode ? '#ffffff' : '#000000';
  
  // Remplacer les délimiteurs \( et \) par $ et $
  content = content.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
  
  const parts = content.split(/(\$[^$]*\$)/g);

  const renderContainer = (children: React.ReactNode) => {
    if (Platform.OS === 'web') {
      return <div className="container">{children}</div>;
    }
    return <View className="container">{children}</View>;
  };

  const renderMathContainer = (children: React.ReactNode, key: number) => {
    if (Platform.OS === 'web') {
      return <div key={key} className="formules">{children}</div>;
    }
    return <View key={key} style={styles.mathContainer}>{children}</View>;
  };

  const renderTextContainer = (children: React.ReactNode, key: number) => {
    if (Platform.OS === 'web') {
      return <div key={key} className="textContainer">{children}</div>;
    }
    return <View key={key} style={styles.textContainer}>{children}</View>;
  };

  return renderContainer(
    parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        // C'est une formule mathématique
        return renderMathContainer(
          <MathJaxSvg
            fontSize={16}
            color={textColor}
            fontCache={true}
            style={styles.mathPart}
          >
            {part.replace(/\\\\/g, '\\')}
          </MathJaxSvg>,
          index
        );
      } else if (part.trim()) {
        // C'est du texte normal
        return renderTextContainer(
          <Text
            style={[
              styles.textPart,
              type === 'question' && styles.questionText,
              type === 'option' && styles.optionText,
              type === 'explanation' && styles.explanationText,
              type === 'cours' && styles.coursText
            ]}
          >
            {part}
          </Text>,
          index
        );
      }
      return null;
    })
  );
};

export const renderMathText = MathText;