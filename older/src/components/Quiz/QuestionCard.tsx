import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Question } from '@types';
import { theme } from '@styles/theme';

const { width } = Dimensions.get('window');

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
}) => {
  return (
    <LinearGradient
      colors={theme.colors.quiz}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          Question {questionNumber} of {totalQuestions}
        </Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{question.category}</Text>
        </View>
      </View>
      
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>
      
      <View style={styles.difficultyIndicator}>
        <Text style={[styles.difficultyText, getDifficultyStyle(question.difficulty)]}>
          {question.difficulty.toUpperCase()}
        </Text>
      </View>
    </LinearGradient>
  );
};

const getDifficultyStyle = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return { color: theme.colors.success };
    case 'medium':
      return { color: theme.colors.warning };
    case 'hard':
      return { color: theme.colors.error };
    default:
      return { color: theme.colors.textMedium };
  }
};

const styles = StyleSheet.create({
  container: {
    width: width - theme.spacing.lg * 2,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  questionNumber: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMedium,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textDark,
    fontWeight: '600',
  },
  questionContainer: {
    minHeight: 80,
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  questionText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textDark,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  difficultyIndicator: {
    alignSelf: 'center',
  },
  difficultyText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
});