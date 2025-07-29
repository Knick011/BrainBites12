import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenTimeModule, TimerState, TimerStatus, useScreenTimeEvents } from '@/native/ScreenTimeModule';
import { formatDuration } from '@/utils/timeUtils';

interface TimerWidgetProps {
  onEarnMorePress?: () => void;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({ onEarnMorePress }) => {
  const [timerState, setTimerState] = useState<TimerStatus | null>(null);

  useEffect(() => {
    // Initial timer state
    ScreenTimeModule.getTimerState().then(setTimerState);

    // Subscribe to timer updates
    const unsubscribe = useScreenTimeEvents((state) => {
      setTimerState(state);
    });

    return unsubscribe;
  }, []);

  if (!timerState) return null;

  const getStatusIcon = (state: TimerState) => {
    switch (state) {
      case TimerState.RUNNING:
        return '🟢';
      case TimerState.PAUSED:
        return '⏸️';
      case TimerState.FOREGROUND:
        return '📱';
      case TimerState.DEBT_MODE:
        return '⚠️';
      default:
        return '⚫';
    }
  };

  const getStatusText = (state: TimerState) => {
    switch (state) {
      case TimerState.RUNNING:
        return 'Running';
      case TimerState.PAUSED:
        return 'Paused';
      case TimerState.FOREGROUND:
        return 'In App';
      case TimerState.DEBT_MODE:
        return 'Time Up!';
      default:
        return 'Inactive';
    }
  };

  return (
    <View style={styles.container}>
      {/* Time Left Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Time Left</Text>
        <Text style={styles.timeText}>
          {formatDuration(timerState.remainingTime)}
        </Text>
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>
            {getStatusIcon(timerState.state)}
          </Text>
          <Text style={styles.statusText}>
            {getStatusText(timerState.state)}
          </Text>
        </View>
      </View>

      {/* Screen Time Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Screen Time Today</Text>
        <Text style={styles.timeText}>
          {formatDuration(timerState.todayScreenTime)}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar,
            { width: `${(timerState.remainingTime / (8 * 3600)) * 100}%` }
          ]} 
        />
      </View>

      {/* Action Button */}
      {timerState.remainingTime < 3600 && ( // Show when less than 1 hour remains
        <TouchableOpacity 
          style={styles.button}
          onPress={onEarnMorePress}
        >
          <Text style={styles.buttonText}>Earn More Time</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 