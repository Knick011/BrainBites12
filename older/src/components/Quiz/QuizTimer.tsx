import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { CircularProgress } from 'react-native-circular-progress';
import { theme } from '@styles/theme';

interface QuizTimerProps {
  timeLeft: number;
  totalTime: number;
  onTimeUp: () => void;
  isActive: boolean;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({
  timeLeft,
  totalTime,
  onTimeUp,
  isActive,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const warningThreshold = totalTime * 0.2; // 20% of total time
  
  useEffect(() => {
    if (timeLeft <= 0 && isActive) {
      onTimeUp();
    }
  }, [timeLeft, isActive, onTimeUp]);
  
  useEffect(() => {
    if (timeLeft <= warningThreshold && timeLeft > 0) {
      // Pulse animation when time is running low
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [timeLeft, warningThreshold]);
  
  const getProgressColor = () => {
    if (timeLeft <= warningThreshold * 0.5) {
      return theme.colors.error;
    } else if (timeLeft <= warningThreshold) {
      return theme.colors.warning;
    }
    return '#4CAF50';
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progressPercentage = (timeLeft / totalTime) * 100;
  
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.timerWrapper,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <CircularProgress
          size={80}
          width={6}
          fill={progressPercentage}
          tintColor={getProgressColor()}
          backgroundColor="rgba(0, 0, 0, 0.1)"
          rotation={0}
          lineCap="round"
        >
          {() => (
            <Text style={[styles.timeText, { color: getProgressColor() }]}>
              {formatTime(timeLeft)}
            </Text>
          )}
        </CircularProgress>
      </Animated.View>
      
      {timeLeft <= warningThreshold && (
        <Text style={styles.warningText}>
          {timeLeft <= warningThreshold * 0.5 ? 'Hurry up!' : 'Time running out!'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  timerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  warningText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});