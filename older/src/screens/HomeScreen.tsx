import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MascotDisplay } from '@components/Mascot/MascotDisplay';
import { useUserStore } from '../store/userStore';
import { useAudio } from '@services/useAudio';
import { theme } from '@styles/theme';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useUserStore();
  const { playSound } = useAudio();
  
  const handleStartQuiz = (difficulty: 'easy' | 'medium' | 'hard') => {
    playSound('buttonClick');
    navigation.navigate('Quiz', { difficulty });
  };
  
  const difficultyOptions = [
    {
      level: 'easy' as const,
      title: 'Easy',
      subtitle: '10 points • 1 minute',
      icon: 'school',
      colors: ['#E8F5E8', '#C8E6C9'],
      iconColor: theme.colors.success,
    },
    {
      level: 'medium' as const,
      title: 'Medium',
      subtitle: '20 points • 2 minutes',
      icon: 'psychology',
      colors: ['#FFF3E0', '#FFE0B2'],
      iconColor: theme.colors.warning,
    },
    {
      level: 'hard' as const,
      title: 'Hard',
      subtitle: '30 points • 3 minutes',
      icon: 'emoji_events',
      colors: ['#FFEBEE', '#FFCDD2'],
      iconColor: theme.colors.error,
    },
  ];
  
  return (
    <LinearGradient
      colors={theme.colors.primary}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name}!</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Icon name="stars" size={20} color={theme.colors.warning} />
              <Text style={styles.statValue}>{user.totalScore}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="local-fire-department" size={20} color={theme.colors.error} />
              <Text style={styles.statValue}>{user.streak}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.mascotSection}>
          <MascotDisplay size="large" showMessage />
        </View>
        
        <View style={styles.dailyProgress}>
          <Text style={styles.sectionTitle}>Daily Progress</Text>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#4CAF50', '#8BC34A']}
              style={[
                styles.progressFill,
                { width: `${(user.dailyProgress / user.dailyGoal) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {user.dailyProgress} / {user.dailyGoal} games today
          </Text>
        </View>
        
        <View style={styles.difficultySection}>
          <Text style={styles.sectionTitle}>Choose Your Challenge</Text>
          
          {difficultyOptions.map((option) => (
            <TouchableOpacity
              key={option.level}
              onPress={() => handleStartQuiz(option.level)}
              style={styles.difficultyCard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={option.colors}
                style={styles.cardGradient}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <Icon
                      name={option.icon}
                      size={32}
                      color={option.iconColor}
                      style={styles.cardIcon}
                    />
                    <View>
                      <Text style={styles.cardTitle}>{option.title}</Text>
                      <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
                    </View>
                  </View>
                  
                  <Icon
                    name="arrow-forward-ios"
                    size={20}
                    color={theme.colors.textMedium}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.lg,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMedium,
    fontWeight: '500',
  },
  userName: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.textDark,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  mascotSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  dailyProgress: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMedium,
    textAlign: 'center',
    fontWeight: '500',
  },
  difficultySection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  difficultyCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGradient: {
    padding: theme.spacing.lg,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    marginRight: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMedium,
    fontWeight: '500',
  },
});