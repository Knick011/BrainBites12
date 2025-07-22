import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MascotDisplay } from '@components/Mascot/MascotDisplay';
import { useMascotController } from '@components/Mascot/useMascotController';
import { useUserStore } from '../store/userStore';
import { useQuizStore } from '../store/quizStore';
import { useAudio } from '@services/useAudio';
import { theme } from '@styles/theme';

const { width } = Dimensions.get('window');

interface ResultsScreenProps {
  navigation: any;
  route: {
    params: {
      score: number;
      totalQuestions: number;
      correctAnswers: number;
      difficulty: 'easy' | 'medium' | 'hard';
    };
  };
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ navigation, route }) => {
  const { score, totalQuestions, correctAnswers, difficulty } = route.params;
  const { user } = useUserStore();
  const { resetQuiz } = useQuizStore();
  const { showQuizComplete } = useMascotController();
  const { playMusic, playSound } = useAudio();
  
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const incorrectAnswers = totalQuestions - correctAnswers;
  
  useEffect(() => {
    // Reset quiz state
    resetQuiz();
    
    // Play menu music
    playMusic('menuMusic');
    
    // Show completion message
    showQuizComplete(score);
    
    // Play celebration sound if good performance
    if (percentage >= 70) {
      setTimeout(() => {
        playSound('celebration');
      }, 1000);
    }
  }, []);
  
  const getPerformanceMessage = () => {
    if (percentage >= 90) {
      return {
        title: 'Outstanding! 🏆',
        message: 'You\'re a quiz master!',
        color: '#FFD700',
      };
    } else if (percentage >= 80) {
      return {
        title: 'Excellent! ⭐',
        message: 'Great job on this quiz!',
        color: theme.colors.success,
      };
    } else if (percentage >= 70) {
      return {
        title: 'Well Done! 👏',
        message: 'You\'re doing great!',
        color: '#4CAF50',
      };
    } else if (percentage >= 50) {
      return {
        title: 'Good Effort! 💪',
        message: 'Keep practicing!',
        color: theme.colors.warning,
      };
    } else {
      return {
        title: 'Keep Learning! 📚',
        message: 'Every quiz makes you smarter!',
        color: theme.colors.error,
      };
    }
  };
  
  const performance = getPerformanceMessage();
  
  const handlePlayAgain = () => {
    playSound('buttonClick');
    navigation.navigate('Quiz', { difficulty });
  };
  
  const handleHome = () => {
    playSound('buttonClick');
    navigation.navigate('Home');
  };
  
  const statsData = [
    {
      icon: 'quiz',
      label: 'Questions',
      value: totalQuestions.toString(),
      color: '#2196F3',
    },
    {
      icon: 'check-circle',
      label: 'Correct',
      value: correctAnswers.toString(),
      color: theme.colors.success,
    },
    {
      icon: 'cancel',
      label: 'Incorrect',
      value: incorrectAnswers.toString(),
      color: theme.colors.error,
    },
    {
      icon: 'percent',
      label: 'Accuracy',
      value: `${percentage}%`,
      color: performance.color,
    },
    {
      icon: 'stars',
      label: 'Score',
      value: score.toString(),
      color: '#FFD700',
    },
    {
      icon: 'trending-up',
      label: 'Difficulty',
      value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
      color: '#9C27B0',
    },
  ];
  
  return (
    <LinearGradient colors={theme.colors.primary} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Quiz Complete!</Text>
          <Text style={[styles.performanceTitle, { color: performance.color }]}>
            {performance.title}
          </Text>
          <Text style={styles.performanceMessage}>
            {performance.message}
          </Text>
        </View>
        
        <View style={styles.mascotContainer}>
          <MascotDisplay size="large" showMessage />
        </View>
        
        <View style={styles.scoreContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#F5F5F5']}
            style={styles.scoreCard}
          >
            <Text style={styles.scoreLabel}>Final Score</Text>
            <Text style={[styles.scoreValue, { color: performance.color }]}>
              {score}
            </Text>
            <Text style={styles.scoreSubtext}>
              {percentage}% Accuracy
            </Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quiz Statistics</Text>
          
          <View style={styles.statsGrid}>
            {statsData.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                  style={styles.statCardGradient}
                >
                  <Icon name={stat.icon} size={24} color={stat.color} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.userStatsContainer}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
            style={styles.userStatsCard}
          >
            <View style={styles.userStatRow}>
              <Icon name="emoji-events" size={20} color="#FFD700" />
              <Text style={styles.userStatLabel}>Total Score</Text>
              <Text style={styles.userStatValue}>{user.totalScore}</Text>
            </View>
            
            <View style={styles.userStatRow}>
              <Icon name="local-fire-department" size={20} color={theme.colors.error} />
              <Text style={styles.userStatLabel}>Current Streak</Text>
              <Text style={styles.userStatValue}>{user.streak}</Text>
            </View>
            
            <View style={styles.userStatRow}>
              <Icon name="sports-esports" size={20} color="#2196F3" />
              <Text style={styles.userStatLabel}>Games Played</Text>
              <Text style={styles.userStatValue}>{user.gamesPlayed}</Text>
            </View>
            
            <View style={styles.userStatRow}>
              <Icon name="psychology" size={20} color="#9C27B0" />
              <Text style={styles.userStatLabel}>Overall Accuracy</Text>
              <Text style={styles.userStatValue}>
                {user.totalQuestions > 0 
                  ? Math.round((user.correctAnswers / user.totalQuestions) * 100)
                  : 0}%
              </Text>
            </View>
          </LinearGradient>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={handlePlayAgain} style={styles.primaryButton}>
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              style={styles.buttonGradient}
            >
              <Icon name="refresh" size={20} color={theme.colors.white} />
              <Text style={styles.primaryButtonText}>Play Again</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleHome} style={styles.secondaryButton}>
            <View style={styles.secondaryButtonContent}>
              <Icon name="home" size={20} color={theme.colors.textDark} />
              <Text style={styles.secondaryButtonText}>Home</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '800',
    color: theme.colors.textDark,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  performanceTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  performanceMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMedium,
    textAlign: 'center',
    fontWeight: '500',
  },
  mascotContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  scoreCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    width: width * 0.7,
  },
  scoreLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMedium,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  scoreValue: {
    fontSize: theme.fontSize.xxl * 1.5,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  scoreSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMedium,
    fontWeight: '500',
  },
  statsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginVertical: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMedium,
    fontWeight: '500',
  },
  userStatsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  userStatsCard: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  userStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  userStatLabel: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textDark,
    fontWeight: '500',
    marginLeft: theme.spacing.sm,
  },
  userStatValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textDark,
    fontWeight: '700',
  },
  actionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  primaryButton: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.white,
    marginLeft: theme.spacing.sm,
  },
  secondaryButton: {
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  secondaryButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textDark,
    marginLeft: theme.spacing.sm,
  },
});