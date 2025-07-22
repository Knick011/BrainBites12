// src/screens/LeaderboardScreen.tsx
// ✅ FIXES: "Invalid hook call. Hooks can only be called inside of the body of a function component"
// ✅ FIXES: FlatList renderItem hook violations in RN 0.79.5
// console.log: "LeaderboardScreen with proper component structure - no hooks in renderItem functions"

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { logScreenView } from '../config/Firebase';

// Mock leaderboard data - replace with actual data source
interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  rank: number;
  avatar?: string;
  questionsAnswered: number;
  accuracy: number;
}

// ✅ FIX: Extract renderItem as separate component to avoid hooks violations
// This prevents "Invalid hook call" errors in RN 0.79.5
const LeaderboardItem: React.FC<{
  item: LeaderboardEntry;
  index: number;
  isCurrentUser?: boolean;
}> = ({ item, index, isCurrentUser = false }) => {
  
  // Get rank display with proper styling
  const getRankDisplay = () => {
    const rank = index + 1;
    if (rank === 1) return { icon: 'trophy', color: '#FFD700' }; // Gold
    if (rank === 2) return { icon: 'trophy', color: '#C0C0C0' }; // Silver
    if (rank === 3) return { icon: 'trophy', color: '#CD7F32' }; // Bronze
    return { icon: 'account', color: '#666' };
  };

  const rankInfo = getRankDisplay();
  
  return (
    <View style={[
      styles.leaderboardItem,
      isCurrentUser && styles.currentUserItem
    ]}>
      {/* Rank/Trophy */}
      <View style={styles.rankContainer}>
        <Icon 
          name={rankInfo.icon} 
          size={24} 
          color={rankInfo.color} 
        />
        <Text style={[styles.rankText, { color: rankInfo.color }]}>
          #{index + 1}
        </Text>
      </View>
      
      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={[
          styles.username,
          isCurrentUser && styles.currentUserText
        ]}>
          {item.username}
        </Text>
        <Text style={styles.userStats}>
          {item.questionsAnswered} questions • {item.accuracy}% accuracy
        </Text>
      </View>
      
      {/* Score */}
      <View style={styles.scoreContainer}>
        <Text style={[
          styles.score,
          isCurrentUser && styles.currentUserText
        ]}>
          {item.score.toLocaleString()}
        </Text>
        <Text style={styles.scoreLabel}>points</Text>
      </View>
    </View>
  );
};

// ✅ FIX: Main LeaderboardScreen component with proper hooks usage
const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // State management
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('user123'); // Replace with actual user ID
  const [error, setError] = useState<string | null>(null);

  // ✅ CORRECT: useCallback for functions that don't violate hooks rules
  const loadLeaderboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        console.log('🔄 [RN 0.79.5] Refreshing leaderboard data...');
        setIsRefreshing(true);
      } else {
        console.log('📊 [RN 0.79.5] Loading leaderboard data...');
        setIsLoading(true);
      }
      
      setError(null);
      
      // Simulate API call - replace with actual data fetching
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual leaderboard service
      const mockData: LeaderboardEntry[] = [
        {
          id: 'user456',
          username: 'QuizMaster',
          score: 15420,
          rank: 1,
          questionsAnswered: 2450,
          accuracy: 89,
        },
        {
          id: 'user789',
          username: 'BrainChamp',
          score: 12350,
          rank: 2,
          questionsAnswered: 1890,
          accuracy: 92,
        },
        {
          id: 'user123', // Current user
          username: 'You',
          score: 8750,
          rank: 3,
          questionsAnswered: 1250,
          accuracy: 85,
        },
        {
          id: 'user321',
          username: 'StudyGuru',
          score: 7890,
          rank: 4,
          questionsAnswered: 1150,
          accuracy: 88,
        },
        {
          id: 'user654',
          username: 'FactFinder',
          score: 6540,
          rank: 5,
          questionsAnswered: 980,
          accuracy: 91,
        },
        {
          id: 'user987',
          username: 'WisdomSeeker',
          score: 5230,
          rank: 6,
          questionsAnswered: 750,
          accuracy: 87,
        },
        {
          id: 'user147',
          username: 'KnowledgeKing',
          score: 4890,
          rank: 7,
          questionsAnswered: 650,
          accuracy: 90,
        },
        {
          id: 'user258',
          username: 'QuizWhiz',
          score: 4320,
          rank: 8,
          questionsAnswered: 580,
          accuracy: 84,
        },
        {
          id: 'user369',
          username: 'BrainBuster',
          score: 3750,
          rank: 9,
          questionsAnswered: 520,
          accuracy: 86,
        },
        {
          id: 'user741',
          username: 'ThinkTank',
          score: 3210,
          rank: 10,
          questionsAnswered: 450,
          accuracy: 83,
        },
      ];
      
      setLeaderboardData(mockData);
      console.log('✅ [RN 0.79.5] Leaderboard data loaded successfully');
      
    } catch (error: any) {
      console.log('❌ [RN 0.79.5] Error loading leaderboard:', error);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // ✅ CORRECT: useEffect for component lifecycle
  useEffect(() => {
    console.log('🚀 [RN 0.79.5] LeaderboardScreen mounted');
    loadLeaderboardData();
  }, [loadLeaderboardData]);

  // ✅ CORRECT: useFocusEffect for screen focus events
  useFocusEffect(
    useCallback(() => {
      console.log('👀 [RN 0.79.5] LeaderboardScreen focused');
      
      // Log screen view
      logScreenView('Leaderboard').catch(error => {
        console.log('⚠️ [RN 0.79.5] Failed to log screen view:', error);
      });
    }, [])
  );

  // ✅ CORRECT: Regular function that doesn't use hooks
  const handleRefresh = () => {
    console.log('🔄 [RN 0.79.5] User requested leaderboard refresh');
    loadLeaderboardData(true);
  };

  // ✅ CORRECT: Regular function for navigation
  const handleBackPress = () => {
    console.log('🔙 [RN 0.79.5] User navigating back from leaderboard');
    navigation.goBack();
  };

  // ✅ CORRECT: Render function using FlatList with proper component
  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = item.id === currentUserId;
    
    return (
      <LeaderboardItem 
        item={item} 
        index={index} 
        isCurrentUser={isCurrentUser}
      />
    );
  };

  // ✅ CORRECT: KeyExtractor function
  const keyExtractor = (item: LeaderboardEntry) => item.id;

  // Loading state
  if (isLoading && leaderboardData.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadLeaderboardData()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Leaderboard Content */}
      <View style={styles.content}>
        {/* Header Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Top {leaderboardData.length} Players
          </Text>
        </View>

        {/* ✅ CORRECT: FlatList with proper renderItem component */}
        <FlatList
          data={leaderboardData}
          renderItem={renderLeaderboardItem}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#FFD700']}
              tintColor="#FFD700"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  currentUserItem: {
    backgroundColor: '#FFF9C4',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  currentUserText: {
    color: '#F57C00',
    fontWeight: 'bold',
  },
  userStats: {
    fontSize: 12,
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  separator: {
    height: 12,
  },
});

export default LeaderboardScreen;