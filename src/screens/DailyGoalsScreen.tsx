// src/screens/DailyGoalsScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Animated,
  Easing,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, DailyGoal } from '../types';
import theme from '../styles/theme';
import SoundService from '../services/SoundService';
import EnhancedScoreService from '../services/EnhancedScoreService';
import EnhancedMascotDisplay from '../components/Mascot/EnhancedMascotDisplay';

// ✅ LIVE STATE INTEGRATION
import { useDailyGoalsIntegration } from '../hooks/useGameIntegration';

type NavigationProp = StackNavigationProp<RootStackParamList, 'DailyGoals'>;
type MascotType = 'happy' | 'sad' | 'excited' | 'depressed' | 'gamemode' | 'below';

interface GoalTemplate {
  id: string;
  type: 'questions' | 'streak' | 'accuracy' | 'difficulty' | 'category' | 'perfect';
  target: number | string;
  minQuestions?: number;
  reward: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface GoalProgress {
  current: number;
  target?: number;
  questionsAnswered?: number;
  completed: boolean;
  claimed: boolean;
}

// Available daily goals
const DAILY_GOALS_POOL: GoalTemplate[] = [
  {
    id: 'questions_30',
    type: 'questions',
    target: 30,
    reward: 30,
    title: 'Quiz Master',
    description: 'Answer 30 questions',
    icon: 'help-circle-outline',
    color: '#4CAF50'
  },
  {
    id: 'questions_50',
    type: 'questions',
    target: 50,
    reward: 60,
    title: 'Knowledge Seeker',
    description: 'Answer 50 questions',
    icon: 'help-circle-outline',
    color: '#4CAF50'
  },
  {
    id: 'streak_10',
    type: 'streak',
    target: 10,
    reward: 45,
    title: 'Streak Champion',
    description: 'Achieve 10 question streak',
    icon: 'fire',
    color: '#FF9F1C'
  },
  {
    id: 'streak_15',
    type: 'streak',
    target: 15,
    reward: 60,
    title: 'Streak Master',
    description: 'Achieve 15 question streak',
    icon: 'fire',
    color: '#FF9F1C'
  },
  {
    id: 'accuracy_80',
    type: 'accuracy',
    target: 80,
    minQuestions: 20,
    reward: 60,
    title: 'Precision Expert',
    description: 'Get 80% accuracy (min 20 questions)',
    icon: 'target',
    color: '#2196F3'
  },
  {
    id: 'hard_quiz',
    type: 'difficulty',
    target: 'hard',
    minQuestions: 10,
    reward: 45,
    title: 'Challenge Accepted',
    description: 'Complete a Hard difficulty quiz (10+ questions)',
    icon: 'trophy-outline',
    color: '#E91E63'
  },
  {
    id: 'category_science',
    type: 'category',
    target: 'science',
    minQuestions: 15,
    reward: 30,
    title: 'Science Explorer',
    description: 'Answer 15 science questions',
    icon: 'flask-outline',
    color: '#9C27B0'
  },
  {
    id: 'perfect_10',
    type: 'perfect',
    target: 10,
    reward: 40,
    title: 'Perfect Run',
    description: 'Get 10 questions correct in a row',
    icon: 'star-circle-outline',
    color: '#FFD700'
  }
];

const DailyGoalsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  // ✅ LIVE STATE INTEGRATION - Replaces old state management
  const { 
    dailyGoals, 
    animatingGoals, 
    handleClaimReward, 
    refreshProgress,
    completedCount, 
    claimedCount, 
    totalRewards,
    isInitialized 
  } = useDailyGoalsIntegration();
  
  // Local UI state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Mascot state
  const [mascotType, setMascotType] = useState<MascotType>('happy');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showMascot, setShowMascot] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef<Animated.Value[]>([]).current;
  const claimButtonAnims = useRef<Animated.Value[]>([]).current;
  
  useEffect(() => {
    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Initialize animations for goals
    dailyGoals.forEach((_, index) => {
      if (!slideAnims[index]) {
        slideAnims[index] = new Animated.Value(50);
        claimButtonAnims[index] = new Animated.Value(1);
      }
      
      Animated.timing(slideAnims[index], {
        toValue: 0,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });
  }, [dailyGoals.length]);
  
  // ✅ UPDATED REFRESH FUNCTION - Uses live state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProgress();
    } catch (error) {
      console.error('Failed to refresh goals:', error);
    }
    setIsRefreshing(false);
  };
  
  // ✅ ENHANCED CLAIM HANDLER - Uses live state management
  const handleClaimGoalReward = async (goalId: string, goalIndex: number) => {
    try {
      SoundService.playStreak();
      
      // Animate claim button
      Animated.sequence([
        Animated.timing(claimButtonAnims[goalIndex], {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(claimButtonAnims[goalIndex], {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(claimButtonAnims[goalIndex], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
      
      // Use live state management
      await handleClaimReward(goalId);
      
      // Show success mascot
      setMascotType('excited');
      setMascotMessage('Reward claimed! Great job! 🎉');
      setShowMascot(true);
      
    } catch (error) {
      console.error('Failed to claim reward:', error);
      
      // Show error mascot
      setMascotType('sad');
      setMascotMessage('Oops! Try again later. 😅');
      setShowMascot(true);
    }
  };
  
  const renderGoalItem = (goal: any, index: number) => {
    const progressPercentage = Math.min((goal.current / goal.target) * 100, 100);
    
    return (
      <Animated.View
        key={goal.id}
        style={[
          styles.goalCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateX: slideAnims[index]?.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 50]
                }) || 0
              }
            ]
          }
        ]}
      >
        {/* Goal Header */}
        <View style={styles.goalHeader}>
          <View style={[styles.goalIconContainer, { backgroundColor: goal.color + '20' }]}>
            <Icon name={goal.icon} size={24} color={goal.color} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalDescription}>{goal.description}</Text>
          </View>
          <View style={styles.rewardContainer}>
            <Icon name="timer-outline" size={16} color="#FF9F1C" />
            <Text style={styles.rewardText}>+{goal.reward}m</Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: goal.completed ? '#4CAF50' : goal.color
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {goal.type === 'accuracy' && goal.questionsAnswered !== undefined
              ? `${goal.current}% (${goal.questionsAnswered}/${goal.minQuestions} questions)`
              : `${goal.current}/${goal.target}`}
          </Text>
        </View>
        
        {/* Claim Button */}
        {goal.completed && (
          <Animated.View
            style={{
              transform: [{ scale: claimButtonAnims[index] || 1 }],
              opacity: goal.claimed ? 0.5 : 1
            }}
          >
            <TouchableOpacity
              style={[
                styles.claimButton,
                goal.claimed && styles.claimedButton
              ]}
              onPress={() => handleClaimGoalReward(goal.id, index)}
              disabled={goal.claimed}
            >
              <Icon 
                name={goal.claimed ? "check-circle" : "gift-outline"} 
                size={20} 
                color="white" 
              />
              <Text style={styles.claimButtonText}>
                {goal.claimed ? 'Claimed' : 'Claim Reward'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('Home');
          }
        }} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Daily Goals</Text>
          <Text style={styles.headerSubtitle}>Complete to earn time!</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Summary Card */}
      <Animated.View 
        style={[
          styles.summaryCard,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{completedCount}/3</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{claimedCount}/3</Text>
            <Text style={styles.summaryLabel}>Claimed</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalRewards}m</Text>
            <Text style={styles.summaryLabel}>Earned</Text>
          </View>
        </View>
      </Animated.View>
      
      {/* Goals List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {dailyGoals.map((goal, index) => renderGoalItem(goal, index))}
        
        <View style={styles.footer}>
          <Icon name="information-circle-outline" size={20} color="#999" />
          <Text style={styles.footerText}>
            Goals reset daily at midnight
          </Text>
        </View>
      </ScrollView>
      
      {/* Enhanced Mascot */}
      <EnhancedMascotDisplay
        type={mascotType}
        position="right"
        showMascot={showMascot}
        message={mascotMessage}
        onDismiss={() => setShowMascot(false)}
        autoHide={true}
        autoHideDuration={3000}
        fullScreen={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    ...theme.shadows.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.medium,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rewardText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9F1C',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  claimButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    ...theme.shadows.small,
  },
  claimedButton: {
    backgroundColor: '#4CAF50',
  },
  claimButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    marginLeft: 8,
  },
});

export default DailyGoalsScreen;