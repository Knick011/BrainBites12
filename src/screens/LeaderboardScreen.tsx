// src/screens/LeaderboardScreen.tsx - Modern implementation based on reference with Firebase removed
// ✅ FIXES: Complete redesign using reference implementation without Firebase
// ✅ FIXES: Capybara theming and fake data generation maintained
// console.log: "Modern LeaderboardScreen with Firebase removed and enhanced UI"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Animated,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SoundService from '../services/SoundService';
import EnhancedScoreService from '../services/EnhancedScoreService';

// Funny capybara-themed player names - expanded for more variety!
const FAKE_NAMES = [
  'CapyBOSSa', 'CapyBALLER', 'HappyBara', 'CapyGOATa', 'CapyBrainiac',
  'CapyCrusher', 'BaraKing', 'CapyChampion', 'RodentRoyalty', 'CapyGenius',
  'AquaticAce', 'CapyMaster', 'SwimmingScholar', 'CapyPro2024', 'BaraBoss',
  'CapyBaller', 'ChillBara', 'CapyDominant', 'SplashyBara', 'CapyElite',
  'BaraGOD', 'CapyLegend', 'WaterPigWins', 'CapyStrong', 'BaraBeats',
  'CapyClever', 'SmartBara', 'CapyQuizKing', 'BaraBrains', 'CapySharp',
  'RodentRuler', 'CapySwift', 'BaraBlitz', 'CapyQuick', 'FastBara',
  'CapyNinja', 'StealthyBara', 'CapyWarrior', 'BaraBattle', 'CapyVictor',
  'WinningBara', 'CapyChamp', 'BaraBest', 'CapySupreme', 'EliteBara',
  'CapyWizard', 'MagicBara', 'CapySage', 'WiseBara', 'CapyOracle',
  'BaraBarista', 'CoffeeCapy', 'SleepyBara', 'NightCapy', 'CapyDreamer',
  'ZenBara', 'ChillCapybara', 'RelaxedRodent', 'CalmCapy', 'PeacefulBara',
  'StudyBara', 'BookishCapy', 'NerdyBara', 'CapyScholar', 'AcademicBara',
  // More fun characters!
  'CapySnacksAlot', 'LazyBara', 'CapyMunchies', 'SunbathingBara', 'CapyFloaty',
  'WetBara', 'CapyBubbles', 'MudBathBara', 'CapySnoozer', 'TranquilBara',
  'CapyVibes', 'ChonkyBara', 'CapyThicc', 'RoundBara', 'CapyBouncy',
  'GentleBara', 'CapyKindness', 'SweetBara', 'CapyHugs', 'CozyBara',
  'CapyNaps', 'DreamyBara', 'CapyCloud9', 'FluffyBara', 'CapySoft',
  'WisdomBara', 'CapyMentor', 'SeniorBara', 'CapyElder', 'VeteranBara',
  'CapyNewbie', 'FreshBara', 'YoungCapy', 'BabyBara', 'TinyCapy',
  'GigaBara', 'MegaCapy', 'UltraBara', 'SuperCapy', 'HyperBara',
  'CapySpeed', 'TurboBara', 'RocketCapy', 'JetBara', 'CapyZoom',
  'QuietBara', 'CapyWhisper', 'SilentBara', 'CapyMute', 'StealthBara'
];

// Calculate score for hours of play
// Assuming average of 10 seconds per question, 100 points per correct answer
// 4 hours = 14,400 seconds = 1,440 questions = 144,000 base points
// With streaks and bonuses, could be ~200,000-300,000 points
const TOP_PLAYER_DAILY_SCORE = 120000;

// Shuffle array to get random capybara names
const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate top 10 ultra-competitive scores with varied characters
const generateTop10DailyScores = () => {
  const scores = [];
  let currentScore = TOP_PLAYER_DAILY_SCORE;
  
  // Shuffle names to get variety each time
  const shuffledNames = shuffleArray(FAKE_NAMES);
  
  // Top 10 players have very high scores, close competition
  for (let i = 0; i < 10; i++) {
    const dropPercentage = 0.92 + (Math.random() * 0.06); // 92-98% of previous
    currentScore = Math.floor(currentScore * dropPercentage);
    
    scores.push({
      id: `top_${i}`,
      rank: i + 1,
      displayName: shuffledNames[i],
      score: currentScore,
      highestStreak: Math.floor(Math.random() * 25) + 5, // 5-30 streak for more variety
      isCurrentUser: false,
      lastActive: i < 3 ? 'Online now' : `${Math.floor(Math.random() * 59) + 1}m ago`,
    });
  }
  
  return scores;
};

// Calculate user's actual rank based on score
const calculateUserRank = (userScore: number) => {
  // Handle case where user has 0 score
  if (userScore === 0) {
    return Math.floor(Math.random() * 1000) + 5000; // Random rank between 5000-6000
  }
  
  // Rough calculation: every 100 points difference = ~3 ranks
  // This creates a realistic distribution
  const scoreDifference = TOP_PLAYER_DAILY_SCORE - userScore;
  const estimatedRank = Math.floor(scoreDifference / 100) * 3 + 11;
  
  // Add some randomness
  const variance = Math.floor(Math.random() * 20) - 10;
  
  return Math.max(11, estimatedRank + variance);
};

// Generate players around user's rank with more variety
const generateAroundUserScores = (userScore: number, userRank: number) => {
  const scores = [];
  // Get a fresh shuffle of names for variety
  const shuffledNames = shuffleArray(FAKE_NAMES);
  
  // Generate 3 players above and 3 below the user for more context
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue; // Skip user's position
    let rank = userRank + i;
    if (isNaN(rank)) rank = 1000 + i; // fallback for NaN
    
    // More varied score differences
    const scoreDiff = i * (30 + Math.random() * 70); // 30-100 points difference per rank
    const score = Math.max(50, Math.floor(userScore - scoreDiff));
    
    // Use different names from the shuffled array
    const nameIndex = Math.abs(rank + i * 7) % FAKE_NAMES.length;
    
    scores.push({
      id: `around_${rank}_${i}`, // ensure unique key
      rank: rank,
      displayName: shuffledNames[nameIndex],
      score: score,
      highestStreak: Math.floor(Math.random() * 35) + 3, // 3-38 streak for variety
      isCurrentUser: false,
      lastActive: Math.random() > 0.3 ? `${Math.floor(Math.random() * 23) + 1}h ago` : 
                  Math.random() > 0.5 ? `${Math.floor(Math.random() * 59) + 1}m ago` : 'Online now',
    });
  }
  return scores;
};

interface LeaderboardEntry {
  id: string;
  rank: number;
  displayName: string;
  score: number;
  highestStreak: number;
  isCurrentUser: boolean;
  lastActive: string;
  isSeparator?: boolean;
}

const LeaderboardScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('global'); // 'global', 'friends'
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserDailyScore, setCurrentUserDailyScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    console.log('🏆 [Modern LeaderboardScreen] Component mounted');
    loadUserScore();
    
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Pulse animation for user's entry
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  useEffect(() => {
    loadLeaderboardData();
  }, [activeTab, currentUserDailyScore]);

  // Also load leaderboard data when not loading anymore
  useEffect(() => {
    if (!isLoading) {
      loadLeaderboardData();
    }
  }, [isLoading]);

  // Refresh leaderboard when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🏆 [Modern LeaderboardScreen] Screen focused, refreshing data');
      loadUserScore();
    }, [])
  );
  
  const loadUserScore = async () => {
    try {
      setIsLoading(true);
      // Load real user score from EnhancedScoreService
      await EnhancedScoreService.loadSavedData();
      const scoreInfo = EnhancedScoreService.getScoreInfo();
      const userScore = scoreInfo.dailyScore;
      
      setCurrentUserDailyScore(userScore);
      console.log('📊 [Modern LeaderboardScreen] Loaded real user score:', userScore);
    } catch (error) {
      console.error('❌ [Modern LeaderboardScreen] Error loading user score:', error);
      setCurrentUserDailyScore(0); // Fallback score
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadLeaderboardData = useCallback(() => {
    console.log('🏆 [LeaderboardScreen] Loading leaderboard data for tab:', activeTab, 'with score:', currentUserDailyScore);
    let fakeData: LeaderboardEntry[] = [];
    let userPosition = 0;
    
    switch (activeTab) {
      case 'global': {
        const top10 = generateTop10DailyScores();
        const userRank = calculateUserRank(currentUserDailyScore);
        setUserRank(userRank);
        
        // Create user data object with real streak data
        const scoreInfo = EnhancedScoreService.getScoreInfo();
        const userData = {
          id: 'current_user',
          rank: userRank,
          displayName: 'CaBBybara',
          score: currentUserDailyScore,
          highestStreak: scoreInfo.highestStreak,
          isCurrentUser: true,
          lastActive: 'Online now',
        };
        
        if (currentUserDailyScore > top10[9].score) {
          // User is in top 10
          const insertIndex = top10.findIndex(p => p.score < currentUserDailyScore);
          userData.rank = insertIndex + 1;
          top10.splice(insertIndex, 0, userData);
          top10.pop(); // Remove the last item to keep top 10
          
          // Update ranks for all players
          top10.forEach((player, index) => {
            player.rank = index + 1;
          });
          
          fakeData = top10;
        } else {
          // User is not in top 10, show top 10 + separator + user area
          fakeData = [...top10];
          fakeData.push({ id: 'separator', isSeparator: true } as LeaderboardEntry);
          
          const aroundUser = generateAroundUserScores(currentUserDailyScore, userRank);
          fakeData = fakeData.concat(aroundUser);
          
          // Insert user in the correct position among nearby players
          const insertIndex = fakeData.findIndex(p => !p.isSeparator && p.rank > userRank);
          if (insertIndex !== -1) {
            fakeData.splice(insertIndex, 0, userData);
          } else {
            fakeData.push(userData);
          }
        }
        break;
      }
      case 'friends': {
        // Mix of friend-themed names and regular capybara names for variety
        const friendNames = [
          'BestBaraBuddy', 'StudyCapy', 'CoffeeBara', 'GymCapybara', 'RoommateBara',
          'WorkCapy', 'OldBaraFriend', 'NewCapyPal', 'CoolCapyCousin', 'SisterBara'
        ];
        
        // Add some regular capybara names to friends list for more variety
        const shuffledCapyNames = shuffleArray(FAKE_NAMES).slice(0, 8);
        const allFriendNames = [...friendNames, ...shuffledCapyNames];
        
        const friendScores = allFriendNames.map((name, i) => {
          const variance = (Math.random() - 0.5) * currentUserDailyScore * 0.6; // More score variation
          return {
            id: `friend_${i}`,
            rank: 0,
            displayName: name,
            score: Math.max(50, Math.floor(currentUserDailyScore + variance)),
            highestStreak: Math.floor(Math.random() * 30) + 2, // 2-32 streak variety
            isCurrentUser: false,
            lastActive: i < 4 ? 'Online now' : 
                       i < 8 ? `${Math.floor(Math.random() * 59) + 1}m ago` :
                       `${Math.floor(Math.random() * 23) + 1}h ago`,
          };
        });
        const scoreInfo = EnhancedScoreService.getScoreInfo();
        friendScores.push({
          id: 'current_user',
          rank: 0,
          displayName: 'CaBBybara',
          score: currentUserDailyScore,
          highestStreak: scoreInfo.highestStreak,
          isCurrentUser: true,
          lastActive: 'Online now',
        });
        friendScores.sort((a, b) => b.score - a.score);
        friendScores.forEach((friend, index) => {
          friend.rank = index + 1;
        });
        fakeData = friendScores;
        const userFriendRank = friendScores.findIndex(f => f.isCurrentUser) + 1;
        setUserRank(userFriendRank);
        break;
      }
    }
    console.log('🏆 [LeaderboardScreen] Generated leaderboard data:', fakeData.length, 'items');
    setLeaderboardData(fakeData);
  }, [activeTab, currentUserDailyScore]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    SoundService.playButtonPress();
    
    // Simulate network delay
    await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
    
    // Refresh user score first to get latest data
    await loadUserScore();
    
    // Then reload leaderboard with fresh character variety
    loadLeaderboardData();
    setIsRefreshing(false);
  };
  
  const handleTabChange = (tab: string) => {
    SoundService.playButtonPress();
    setActiveTab(tab);
  };

  // FlatList optimization functions
  const keyExtractor = (item: LeaderboardEntry) => item.id;
  
  const getItemLayout = (_: any, index: number) => ({
    length: 74, // consistent item height (includes margin)
    offset: 74 * index,
    index,
  });

  const renderItem = useCallback(({ item, index }: { item: LeaderboardEntry; index: number }) => {
    return renderLeaderboardItem({ item, index });
  }, [fadeAnim, slideAnim, pulseAnim, activeTab]);
  
  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    if (item.isSeparator) {
      return (
        <View key={item.id} style={styles.separator}>
          <View style={styles.separatorLine} />
          <View style={styles.separatorTextContainer}>
            <Icon name="dots-vertical" size={20} color="#999" />
            <Text style={styles.separatorText}>
              {activeTab === 'global' ? 'Many capybaras later...' : 'More capybaras...'}
            </Text>
            <Icon name="dots-vertical" size={20} color="#999" />
          </View>
          <View style={styles.separatorLine} />
        </View>
      );
    }
    
    const isTopThree = item.rank <= 3;
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
    
    return (
      <Animated.View
        key={item.id}
        style={[
          styles.leaderboardItem,
          item.isCurrentUser && styles.currentUserItem,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, index * 2],
                }),
              },
              item.isCurrentUser ? { scale: pulseAnim } : { scale: 1 },
            ],
          },
        ]}
      >
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <View style={[styles.medal, { backgroundColor: medalColors[item.rank - 1] }]}>
              <Icon name="crown" size={16} color="white" />
              <Text style={styles.medalText}>{item.rank}</Text>
            </View>
          ) : (
            <Text style={[styles.rankText, item.isCurrentUser && styles.currentUserRank]}>
              #{item.rank}
            </Text>
          )}
        </View>
        
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, item.isCurrentUser && styles.currentUserName]}>
            {item.displayName} {item.isCurrentUser && '(You)'}
          </Text>
          <View style={styles.statsRow}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.scoreText}>{(item.score ?? 0).toLocaleString()}</Text>
            {item.highestStreak > 0 && (
              <>
                <Icon name="fire" size={14} color="#FF9F1C" style={{ marginLeft: 12 }} />
                <Text style={styles.streakText}>{item.highestStreak}</Text>
              </>
            )}
            {item.lastActive && activeTab === 'global' && (
              <Text style={styles.lastActive}>{item.lastActive}</Text>
            )}
          </View>
        </View>
        
        {item.isCurrentUser && (
          <Icon name="chevron-right" size={24} color="#FF9F1C" />
        )}
      </Animated.View>
    );
  };
  
  const renderUserCard = useCallback(() => {
    if (!userRank) return null;
    
    const totalPlayers = activeTab === 'friends' ? 19 : '47.3K'; // Updated for more friends
    
    const percentile = activeTab === 'friends' ? 
      Math.round(((19 - userRank) / 18) * 100) :
      Math.round(((1 - (userRank / 47300)) * 100));
    
    return (
      <Animated.View 
        style={[
          styles.userCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: pulseAnim }],
          }
        ]}
      >
        <View style={styles.userCardContent}>
          <View style={styles.userCardLeft}>
            <Text style={styles.userCardLabel}>Your Rank</Text>
            <Text style={styles.userCardRank}>#{userRank}</Text>
            <Text style={styles.userCardSubtext}>of {totalPlayers} capybaras</Text>
          </View>
          <View style={styles.userCardRight}>
            <Text style={styles.userCardLabel}>Top {percentile}%</Text>
            <Text style={styles.userCardScore}>
              {(currentUserDailyScore ?? 0).toLocaleString()}
            </Text>
            <Text style={styles.userCardSubtext}>points</Text>
          </View>
        </View>
      </Animated.View>
    );
  }, [userRank, currentUserDailyScore, activeTab, fadeAnim, pulseAnim]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          SoundService.playButtonPress();
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            (navigation as any).navigate('Home');
          }
        }} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Capybara Rankings</Text>
          <Text style={styles.headerSubtitle}>CaBBybara Leaderboard</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'global' && styles.activeTab]}
          onPress={() => handleTabChange('global')}
        >
          <Icon name="earth" size={20} color={activeTab === 'global' ? '#FF9F1C' : '#777'} />
          <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>Global</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => handleTabChange('friends')}
        >
          <Icon name="account-group" size={20} color={activeTab === 'friends' ? '#FF9F1C' : '#777'} />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>Friends</Text>
        </TouchableOpacity>
      </View>
      
      {/* User's rank card */}
      {renderUserCard()}
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9F1C" />
          <Text style={styles.loadingText}>Loading scores...</Text>
        </View>
      )}
      
             {/* Leaderboard list */}
       {!isLoading && leaderboardData.length > 0 && (
       <FlatList
         data={leaderboardData}
         renderItem={renderItem}
         keyExtractor={keyExtractor}
         style={styles.scrollView}
         contentContainerStyle={styles.scrollContent}
         showsVerticalScrollIndicator={false}
         removeClippedSubviews={false}
         refreshControl={
           <RefreshControl
             refreshing={isRefreshing}
             onRefresh={handleRefresh}
             colors={['#FF9F1C']}
             tintColor={'#FF9F1C'}
           />
         }
         ListFooterComponent={() => (
           <View style={styles.footer}>
             <Icon name="rodent" size={20} color="#999" />
             <Text style={styles.footerText}>
               {'Capybara scores reset daily at midnight'}
             </Text>
           </View>
         )}
       />
       )}
       
       {/* Show message if no data */}
       {!isLoading && leaderboardData.length === 0 && (
         <View style={styles.emptyContainer}>
           <Icon name="rodent" size={48} color="#ccc" />
           <Text style={styles.emptyText}>No capybaras found!</Text>
           <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
             <Text style={styles.retryButtonText}>Try Again</Text>
           </TouchableOpacity>
         </View>
       )}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF9F1C',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#777',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
  },
  activeTabText: {
    color: '#FF9F1C',
    fontWeight: 'bold',
  },
  userCard: {
    backgroundColor: '#FF9F1C',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  userCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userCardLeft: {
    alignItems: 'flex-start',
  },
  userCardRight: {
    alignItems: 'flex-end',
  },
  userCardLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  userCardRank: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
  },
  userCardScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  userCardSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  leaderboardItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentUserItem: {
    backgroundColor: '#FFF5E6',
    borderWidth: 2,
    borderColor: '#FF9F1C',
  },
  rankContainer: {
    width: 60,
    alignItems: 'center',
  },
  medal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  medalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginTop: -2,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  currentUserRank: {
    color: '#FF9F1C',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  currentUserName: {
    color: '#FF9F1C',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  streakText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  lastActive: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  separator: {
    marginVertical: 20,
    alignItems: 'center',
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '100%',
  },
  separatorTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
  },
  separatorText: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 8,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#FF9F1C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
});

export default LeaderboardScreen;