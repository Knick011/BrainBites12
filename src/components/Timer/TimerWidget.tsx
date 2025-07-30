// src/components/Timer/TimerWidget.tsx
// ✅ ENHANCED TIMER WIDGET WITH SCREEN TIME DISPLAY
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HybridTimerService from '../../services/HybridTimerService';
import theme from '../../styles/theme';

interface TimerWidgetProps {
  style?: any;
  onPress?: () => void;
}

interface TimerData {
  remainingTime: number;
  todayScreenTime: number;
  isAppForeground: boolean;
  isTracking: boolean;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({ style, onPress }) => {
  const [timerData, setTimerData] = useState<TimerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('🕐 [TimerWidget] Initializing enhanced timer widget...');
    
    let unsubscribe: (() => void) | null = null;
    
    const initializeTimer = async () => {
      try {
        // Initialize hybrid timer service
        await HybridTimerService.initialize();
        
        // Listen for timer updates
        unsubscribe = HybridTimerService.addListener((data: TimerData) => {
          console.log('🕐 [TimerWidget] Timer update received:', data);
          setTimerData(data);
          setError(null);
          setIsLoading(false);
        });
        
        // Get initial data
        const initialData = HybridTimerService.getCurrentData();
        if (initialData) {
          setTimerData(initialData);
          setIsLoading(false);
        }
        
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        
      } catch (err: any) {
        console.error('❌ [TimerWidget] Failed to initialize hybrid timer:', err);
        setError('Timer unavailable');
        setIsLoading(false);
      }
    };
    
    initializeTimer();
    
    return () => {
      unsubscribe?.();
    };
  }, []);

  // Pulse animation for active timer
  useEffect(() => {
    if (timerData?.isTracking) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [timerData?.isTracking]);

  const loadInitialState = async () => {
    try {
      setIsLoading(true);
      
      // Try to get current data from hybrid service
      const currentData = HybridTimerService.getCurrentData();
      if (currentData) {
        console.log('🕐 [TimerWidget] Using cached data from hybrid service');
        setTimerData(currentData);
        setError(null);
      } else {
        console.log('🕐 [TimerWidget] No cached data, initializing...');
        await HybridTimerService.initialize();
      }
    } catch (err: any) {
      console.error('❌ [TimerWidget] Failed to load initial state:', err);
      setError('Timer unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (): string => {
    if (!timerData) return theme.colors.textSecondary;
    
    if (timerData.remainingTime <= 0) return '#F44336'; // Red - no time
    if (timerData.isAppForeground) return '#FF9800'; // Orange - paused
    if (timerData.isTracking) return '#4CAF50'; // Green - running
    return theme.colors.textSecondary; // Gray - paused
  };

  const getStatusIcon = (): string => {
    if (!timerData) return 'timer-off';
    
    if (timerData.remainingTime <= 0) return 'alert';
    if (timerData.isAppForeground) return 'cellphone';
    if (timerData.isTracking) return 'play';
    return 'pause';
  };

  const getStatusText = (): string => {
    if (!timerData) return 'Timer unavailable';
    
    if (timerData.remainingTime <= 0) return 'No time remaining';
    if (timerData.isAppForeground) return 'BrainBites open';
    if (timerData.isTracking) return 'Timer running';
    return 'Timer paused';
  };

  const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return '0m left';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  const formatScreenTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m used today`;
    }
    return `${minutes}m used today`;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.timerWidget, styles.loadingState]}>
          <View style={styles.loadingContent}>
            <Icon name="loading" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.loadingText}>Loading timer...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error || !timerData) {
    return (
      <TouchableOpacity 
        style={[styles.container, style]} 
        onPress={loadInitialState}
        activeOpacity={0.7}
      >
        <View style={[styles.timerWidget, styles.errorState]}>
          <Icon name="refresh" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.errorText}>Tap to retry</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        style, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }]
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.timerWidget}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.timeDisplay}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLeft}>
              {formatTimeLeft(timerData.remainingTime)}
            </Text>
            <View style={styles.statusBadge}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: getStatusColor() }
                ]} 
              />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
          
          <View style={styles.screenTimeRow}>
            <Icon name="clock-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.screenTime}>
              {formatScreenTime(timerData.todayScreenTime)}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusIndicator}>
          <Icon 
            name={getStatusIcon()} 
            size={20} 
            color={getStatusColor()} 
            style={styles.statusIcon}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  timerWidget: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.small,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  timeDisplay: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timeLeft: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  screenTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  statusIndicator: {
    alignItems: 'center',
    marginLeft: 12,
  },
  statusIcon: {
    opacity: 0.8,
  },
  loadingState: {
    justifyContent: 'center',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  errorState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
});