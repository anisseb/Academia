import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { DysText } from './DysText';
import { AudioButton } from './AudioButton';
import { useSimplifyText } from '../hooks/useSimplifyText';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';

interface AccessibleExerciseProps {
  title: string;
  instruction: string;
  children: React.ReactNode;
}

export const AccessibleExercise: React.FC<AccessibleExerciseProps> = ({
  title,
  instruction,
  children
}) => {
  const { isDarkMode } = useTheme();
  const { isSimplificationEnabled } = useAccessibility();
  const { simplifyText, isSimplifying } = useSimplifyText();
  const [displayedInstruction, setDisplayedInstruction] = useState(instruction);

  useEffect(() => {
    const loadSimplifiedText = async () => {
      const result = await simplifyText(instruction);
      setDisplayedInstruction(result.simplifiedText);
    };

    if (isSimplificationEnabled) {
      loadSimplifiedText();
    } else {
      setDisplayedInstruction(instruction);
    }
  }, [instruction, isSimplificationEnabled, simplifyText]);

  const backgroundColor = isDarkMode ? '#2d2d2d' : '#ffffff';
  const borderColor = isDarkMode ? '#3d3d3d' : '#e5e7eb';

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <View style={styles.header}>
        <DysText style={[styles.title, { color: isDarkMode ? '#ffffff' : '#1f2937' }]}>
          {title}
        </DysText>
        <AudioButton 
          text={`${title}. ${displayedInstruction}`}
          size="small"
          style={styles.audioButton}
        />
      </View>

      <View style={styles.instructionContainer}>
        {isSimplifying ? (
          <ActivityIndicator size="small" color="#60a5fa" />
        ) : (
          <>
            <DysText style={[styles.instruction, { color: isDarkMode ? '#d1d5db' : '#4b5563' }]}>
              {displayedInstruction}
            </DysText>
            {isSimplificationEnabled && displayedInstruction !== instruction && (
              <View style={styles.simplifiedBadge}>
                <DysText style={styles.simplifiedBadgeText}>
                  ✨ Simplifié
                </DysText>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  audioButton: {
    marginLeft: 12,
  },
  instructionContainer: {
    marginBottom: 16,
    minHeight: 40,
    justifyContent: 'center',
  },
  instruction: {
    fontSize: 16,
    lineHeight: 24,
  },
  content: {
    marginTop: 8,
  },
  simplifiedBadge: {
    backgroundColor: '#ddd6fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  simplifiedBadgeText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
  },
});