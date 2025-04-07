import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CircularProgress } from 'react-native-circular-progress';
import { Exercise } from '../types/exercise';
import { renderMathText as MathText } from '../utils/mathRenderer';

interface ExerciseResultsProps {
  exercise: Exercise;
  selectedAnswers: Record<string, number>;
  isDarkMode: boolean;
  themeColors: {
    background: string;
    text: string;
    card: string;
  };
}

export const ExerciseResults: React.FC<ExerciseResultsProps> = ({
  exercise,
  selectedAnswers,
  isDarkMode,
  themeColors,
}) => {
  const totalQuestions = exercise.questions.length;
  const correctAnswers = exercise.questions.filter(
    (q: any, index: number) => selectedAnswers[index] === q.correctAnswer
  ).length;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const score = Math.round((correctAnswers / totalQuestions) * 100);

  return (
    <ScrollView style={styles.scrollView}>
      <View style={[styles.resultsCard, { backgroundColor: themeColors.card }]}>
        <Text style={[styles.resultTitle, { color: themeColors.text }]}>
          Quiz terminé!
        </Text>
        
        <View style={styles.scoreContainer}>
          <CircularProgress
            size={150}
            width={15}
            fill={score}
            tintColor={score >= 50 ? "#4CAF50" : "#FF4B4B"}
            backgroundColor="#F3F4F6"
            rotation={0}
            lineCap="round"
          >
            {() => (
              <View style={styles.scoreTextContainer}>
                <Text style={[styles.scoreValue, { color: themeColors.text }]}>
                  {score}%
                </Text>
                <Text style={[styles.scoreLabel, { color: score >= 50 ? '#4CAF50' : '#FF4B4B' }]}>
                  {score >= 50 ? 'Réussi' : 'À revoir'}
                </Text>
              </View>
            )}
          </CircularProgress>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statItem, { backgroundColor: themeColors.background }]}>
            <View style={[styles.statIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statValue, { color: themeColors.text }]}>{correctAnswers}</Text>
              <Text style={[styles.statLabel, { color: themeColors.text }]}>Correctes</Text>
            </View>
          </View>

          <View style={[styles.statItem, { backgroundColor: themeColors.background }]}>
            <View style={[styles.statIcon, { backgroundColor: '#F44336' }]}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statValue, { color: themeColors.text }]}>{incorrectAnswers}</Text>
              <Text style={[styles.statLabel, { color: themeColors.text }]}>Incorrectes</Text>
            </View>
          </View>
        </View>

        <View style={styles.reviewSection}>
          {exercise.questions.map((question: any, index: number) => {
            const isCorrect = selectedAnswers[index] === question.correctAnswer;
            return (
              <View key={index} style={[styles.reviewQuestion, { backgroundColor: themeColors.background }]}>
                <View style={[styles.reviewQuestionHeader, { borderBottomColor: themeColors.card }]}>
                  <Text style={[styles.reviewQuestionNumber, { color: themeColors.text }]}>
                    Question {index + 1}
                  </Text>
                  <Text style={[styles.reviewQuestionStatus, { color: isCorrect ? '#4CAF50' : '#F44336' }]}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </Text>
                </View>
                <View style={styles.reviewQuestionContent}>
                  <View style={styles.questionTextContainer}>
                    <MathText
                      content={question.question}
                      type="question"
                      isDarkMode={isDarkMode}
                    />
                  </View>
                  <View style={styles.reviewAnswers}>
                    {question.options.map((option: string, optionIndex: number) => {
                      const isSelected = selectedAnswers[index] === optionIndex;
                      const isCorrectAnswer = question.correctAnswer === optionIndex;
                      return (
                        <View
                          key={optionIndex}
                          style={[
                            styles.reviewOption,
                            isCorrectAnswer && styles.reviewCorrectOption,
                            isSelected && !isCorrectAnswer && styles.reviewIncorrectOption,
                          ]}
                        >
                          <View style={styles.reviewOptionContent}>
                            <View style={styles.reviewOptionCircle}>
                              <Text style={styles.reviewOptionLetter}>
                                {String.fromCharCode(65 + optionIndex)}
                              </Text>
                            </View>
                            <View style={styles.reviewOptionTextContainer}>
                              <MathText
                                content={option}
                                type="option"
                                isDarkMode={false}
                              />
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                  {question.explanation && (
                    <View style={styles.reviewExplanation}>
                      <Text style={styles.explanationTitle}>Explication</Text>
                      <View style={styles.explanationContent}>
                        <MathText
                          content={question.explanation}
                          type="explanation"
                          isDarkMode={isDarkMode}
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
 // Espace pour les boutons fixes
  },
  resultsCard: {
    padding: 16,
    borderRadius: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreTextContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  reviewSection: {
    gap: 16,
  },
  reviewQuestion: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  reviewQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  reviewQuestionNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewQuestionStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewQuestionContent: {
    padding: 16,
  },
  questionTextContainer: {
    marginBottom: 17,
  },
  reviewAnswers: {
    gap: 8,
  },
  reviewOption: {
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: '#F3F4F6',
  },
  reviewCorrectOption: {
    borderColor: '#4CAF50',
  },
  reviewIncorrectOption: {
    borderColor: '#F44336',
  },
  reviewOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  reviewOptionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewOptionLetter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  reviewOptionTextContainer: {
    flex: 1,
  },
  reviewExplanation: {
    marginTop: 15,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#60a5fa'
  },
  explanationContent: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
  },
}); 