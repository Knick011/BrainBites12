import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '@styles/theme';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  streak: number;
}

export const QuizProgress: React.FC<QuizProgressProps> = ({
  currentQuestion,
  totalQuestions,
  score,
  streak,
}) => {
  const progressPercentage = (currentQuestion / totalQuestions) * 100;
  
  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Progress</Text>
          <Text style={styles.statValue}>
            {currentQuestion}/{totalQuestions}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Streak</Text>
          <Text style={[styles.statValue, streak > 0 && styles.streakActive]}>
            {streak}
          </Text>
        </View>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#4CAF50', '#8BC34A']}
            style={[styles.progressFill, { width: `${progressPercentage}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progressPercentage)}% Complete
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMedium,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textDark,
    fontWeight: '700',
  },
  streakActive: {
    color: theme.colors.success,
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMedium,
    fontWeight: '600',
  },
});