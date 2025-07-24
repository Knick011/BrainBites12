// src/store/useLiveGameStore.ts
// ✅ LIVE STATE MANAGEMENT SYSTEM - Part 1 of 3
// Real-time reactive state management for scores, streaks, and daily goals
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EnhancedScoreService from '../services/EnhancedScoreService';

// ==================== INTERFACES ====================

export interface LiveScoreData {
  dailyScore: number;
  currentStreak: number;
  highestStreak: number;
  streakLevel: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  questionsToday: number;
}

export interface DailyGoalProgress {
  id: string;
  type: 'questions' | 'streak' | 'accuracy' | 'difficulty' | 'category' | 'perfect';
  title: string;
  description: string;
  target: number;
  current: number;
  progress: number; // 0-1
  completed: boolean;
  claimed: boolean;
  reward: number;
  icon: string;
  color: string;
  questionsRequired?: number;
}

export interface GameEvent {
  type: 'QUIZ_COMPLETED' | 'GOAL_COMPLETED' | 'SCORE_UPDATE' | 'STREAK_MILESTONE' | 'TIMER_BONUS';
  data: any;
  timestamp: number;
}

export interface LiveGameState {
  // Core Data
  scoreData: LiveScoreData;
  dailyGoals: DailyGoalProgress[];
  
  // UI State
  isInitialized: boolean;
  isLoading: boolean;
  lastUpdate: number;
  
  // Animation State
  animatingScore: boolean;
  animatingStreak: boolean;
  animatingGoals: string[];
  
  // Event System
  eventQueue: GameEvent[];
  eventListeners: Map<string, Array<(event: GameEvent) => void>>;
  
  // Actions
  initialize: () => Promise<void>;
  updateScoreData: (scoreData: LiveScoreData) => void;
  processQuizCompletion: (result: {
    isCorrect: boolean;
    pointsEarned: number;
    newScore: number;
    newStreak: number;
    timeEarned?: number;
    category?: string;
    difficulty?: string;
  }) => Promise<void>;
  updateDailyGoalProgress: () => Promise<void>;
  completeGoal: (goalId: string) => Promise<number>; // Returns time bonus
  claimGoalReward: (goalId: string) => Promise<void>;
  
  // Event System
  emitEvent: (event: GameEvent) => void;
  addEventListener: (eventType: string, listener: (event: GameEvent) => void) => () => void;
  
  // Animation Controls
  startScoreAnimation: () => void;
  endScoreAnimation: () => void;
  startStreakAnimation: () => void;
  endStreakAnimation: () => void;
  startGoalAnimation: (goalId: string) => void;
  endGoalAnimation: (goalId: string) => void;
  
  // Utilities
  refreshFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  reset: () => Promise<void>;
}

// ==================== GOAL TEMPLATES ====================

const DAILY_GOALS_POOL = [
  {
    id: 'questions_30',
    type: 'questions' as const,
    target: 30,
    reward: 1800, // 30 minutes
    title: 'Quiz Master',
    description: 'Answer 30 questions',
    icon: 'help-circle-outline',
    color: '#4CAF50'
  },
  {
    id: 'questions_50',
    type: 'questions' as const,
    target: 50,
    reward: 3600, // 60 minutes
    title: 'Knowledge Seeker',
    description: 'Answer 50 questions',
    icon: 'book-open-outline',
    color: '#4CAF50'
  },
  {
    id: 'streak_10',
    type: 'streak' as const,
    target: 10,
    reward: 2700, // 45 minutes
    title: 'Streak Champion',
    description: 'Achieve 10 question streak',
    icon: 'fire',
    color: '#FF9F1C'
  },
  {
    id: 'streak_15',
    type: 'streak' as const,
    target: 15,
    reward: 3600, // 60 minutes
    title: 'Streak Master',
    description: 'Achieve 15 question streak',
    icon: 'fire',
    color: '#FF6B35'
  },
  {
    id: 'accuracy_80',
    type: 'accuracy' as const,
    target: 80,
    questionsRequired: 20,
    reward: 3600, // 60 minutes
    title: 'Precision Expert',
    description: 'Get 80% accuracy (min 20 questions)',
    icon: 'target',
    color: '#2196F3'
  },
  {
    id: 'accuracy_90',
    type: 'accuracy' as const,
    target: 90,
    questionsRequired: 15,
    reward: 5400, // 90 minutes
    title: 'Near Perfect',
    description: 'Get 90% accuracy (min 15 questions)',
    icon: 'bullseye',
    color: '#1976D2'
  },
  {
    id: 'perfect_10',
    type: 'perfect' as const,
    target: 10,
    reward: 2400, // 40 minutes
    title: 'Perfect Run',
    description: 'Get 10 questions correct in a row',
    icon: 'star-circle-outline',
    color: '#FFD700'
  }
];

// ==================== STORAGE KEYS ====================

const STORAGE_KEYS = {
  DAILY_GOALS: '@BrainBites:liveGameStore:dailyGoals',
  GOALS_PROGRESS: '@BrainBites:liveGameStore:goalsProgress',
  LAST_GOAL_RESET: '@BrainBites:liveGameStore:lastGoalReset',
  CLAIMED_REWARDS: '@BrainBites:liveGameStore:claimedRewards'
};

// ==================== HELPER FUNCTIONS ====================

const generateDailyGoals = (): DailyGoalProgress[] => {
  // Shuffle and select 3 random goals
  const shuffled = [...DAILY_GOALS_POOL].sort(() => 0.5 - Math.random());
  const selectedGoals = shuffled.slice(0, 3);
  
  return selectedGoals.map(goal => ({
    id: goal.id,
    type: goal.type,
    title: goal.title,
    description: goal.description,
    target: goal.target,
    current: 0,
    progress: 0,
    completed: false,
    claimed: false,
    reward: goal.reward,
    icon: goal.icon,
    color: goal.color,
    questionsRequired: goal.questionsRequired
  }));
};

const calculateProgress = (current: number, target: number): number => {
  return Math.min(current / target, 1);
};

// ==================== ZUSTAND STORE ====================

export const useLiveGameStore = create<LiveGameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    scoreData: {
      dailyScore: 0,
      currentStreak: 0,
      highestStreak: 0,
      streakLevel: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      questionsToday: 0
    },
    dailyGoals: [],
    isInitialized: false,
    isLoading: false,
    lastUpdate: Date.now(),
    animatingScore: false,
    animatingStreak: false,
    animatingGoals: [],
    eventQueue: [],
    eventListeners: new Map(),

    // ==================== INITIALIZATION ====================
    
    initialize: async () => {
      if (get().isInitialized) return;
      
      set({ isLoading: true });
      
      try {
        // Load score data from EnhancedScoreService
        await EnhancedScoreService.loadSavedData();
        const scoreInfo = EnhancedScoreService.getScoreInfo();
        
        // Convert to our format
        const scoreData: LiveScoreData = {
          dailyScore: scoreInfo.dailyScore,
          currentStreak: scoreInfo.currentStreak,
          highestStreak: scoreInfo.highestStreak,
          streakLevel: scoreInfo.streakLevel,
          totalQuestions: scoreInfo.totalQuestions,
          correctAnswers: scoreInfo.correctAnswers,
          accuracy: scoreInfo.accuracy,
          questionsToday: scoreInfo.questionsToday
        };
        
        // Load or generate daily goals
        await get().loadDailyGoals();
        
        set({
          scoreData,
          isInitialized: true,
          isLoading: false,
          lastUpdate: Date.now()
        });
        
        // Update goal progress
        await get().updateDailyGoalProgress();
        
        console.log('✅ Live Game Store initialized successfully');
        
      } catch (error) {
        console.error('❌ Failed to initialize Live Game Store:', error);
        set({ isLoading: false });
      }
    },

    // ==================== SCORE MANAGEMENT ====================
    
    updateScoreData: (scoreData: LiveScoreData) => {
      set({
        scoreData,
        lastUpdate: Date.now()
      });
      
      // Emit score update event
      get().emitEvent({
        type: 'SCORE_UPDATE',
        data: scoreData,
        timestamp: Date.now()
      });
    },

    processQuizCompletion: async (result) => {
      const { isCorrect, pointsEarned, newScore, newStreak, timeEarned = 0, category, difficulty } = result;
      
      // Update score data immediately
      const currentData = get().scoreData;
      const newScoreData: LiveScoreData = {
        ...currentData,
        dailyScore: newScore,
        currentStreak: newStreak,
        highestStreak: Math.max(currentData.highestStreak, newStreak),
        totalQuestions: currentData.totalQuestions + 1,
        correctAnswers: currentData.correctAnswers + (isCorrect ? 1 : 0),
        questionsToday: currentData.questionsToday + 1,
        accuracy: Math.round(((currentData.correctAnswers + (isCorrect ? 1 : 0)) / (currentData.totalQuestions + 1)) * 100)
      };
      
      // Recalculate streak level
      if (newStreak >= 20) newScoreData.streakLevel = 5;
      else if (newStreak >= 15) newScoreData.streakLevel = 4;
      else if (newStreak >= 10) newScoreData.streakLevel = 3;
      else if (newStreak >= 5) newScoreData.streakLevel = 2;
      else if (newStreak > 0) newScoreData.streakLevel = 1;
      else newScoreData.streakLevel = 0;
      
      // Start animations
      get().startScoreAnimation();
      if (isCorrect && newStreak > currentData.currentStreak) {
        get().startStreakAnimation();
      }
      
      // Update state
      set({
        scoreData: newScoreData,
        lastUpdate: Date.now()
      });
      
      // Update goal progress
      await get().updateDailyGoalProgress();
      
      // Emit quiz completion event
      get().emitEvent({
        type: 'QUIZ_COMPLETED',
        data: {
          isCorrect,
          pointsEarned,
          newScore,
          newStreak,
          timeEarned,
          category,
          difficulty,
          scoreData: newScoreData
        },
        timestamp: Date.now()
      });
      
      // Check for streak milestones
      if (isCorrect && [5, 10, 15, 20, 25].includes(newStreak)) {
        get().emitEvent({
          type: 'STREAK_MILESTONE',
          data: { streak: newStreak, level: newScoreData.streakLevel },
          timestamp: Date.now()
        });
      }
      
      // Save to storage
      await get().saveToStorage();
    },

    // ==================== DAILY GOALS MANAGEMENT ====================
    
    updateDailyGoalProgress: async () => {
      const { scoreData, dailyGoals } = get();
      const quizStats = await EnhancedScoreService.getTodayQuizStats();
      
      const updatedGoals = dailyGoals.map(goal => {
        let current = 0;
        let completed = false;
        
        switch (goal.type) {
          case 'questions':
            current = scoreData.questionsToday;
            completed = current >= goal.target;
            break;
            
          case 'streak':
            current = Math.max(scoreData.currentStreak, scoreData.highestStreak);
            completed = current >= goal.target;
            break;
            
          case 'accuracy':
            if (scoreData.questionsToday >= (goal.questionsRequired || 0)) {
              current = scoreData.accuracy;
              completed = current >= goal.target;
            }
            break;
            
          case 'perfect':
            current = scoreData.currentStreak;
            completed = current >= goal.target;
            break;
            
          case 'difficulty':
            current = quizStats.difficultyCounts?.hard || 0;
            completed = current >= (goal.questionsRequired || goal.target);
            break;
            
          case 'category':
            // This would need category tracking in scoreData
            current = 0; // Placeholder
            break;
        }
        
        const wasCompleted = goal.completed;
        const newProgress = calculateProgress(current, goal.target);
        
        // Check if goal just completed
        if (completed && !wasCompleted && !goal.claimed) {
          get().startGoalAnimation(goal.id);
          
          // Emit goal completion event
          setTimeout(() => {
            get().emitEvent({
              type: 'GOAL_COMPLETED',
              data: {
                goalId: goal.id,
                title: goal.title,
                reward: goal.reward,
                timeBonus: goal.reward
              },
              timestamp: Date.now()
            });
          }, 100);
        }
        
        return {
          ...goal,
          current,
          progress: newProgress,
          completed
        };
      });
      
      set({ dailyGoals: updatedGoals });
    },

    completeGoal: async (goalId: string) => {
      const goal = get().dailyGoals.find(g => g.id === goalId);
      if (!goal || !goal.completed || goal.claimed) return 0;
      
      // Mark as claimed
      const updatedGoals = get().dailyGoals.map(g =>
        g.id === goalId ? { ...g, claimed: true } : g
      );
      
      set({ dailyGoals: updatedGoals });
      
      // Save progress
      await get().saveToStorage();
      
      return goal.reward;
    },

    claimGoalReward: async (goalId: string) => {
      const timeBonus = await get().completeGoal(goalId);
      
      if (timeBonus > 0) {
        // This will be integrated with timer service in Part 3
        get().emitEvent({
          type: 'TIMER_BONUS',
          data: { goalId, timeBonus },
          timestamp: Date.now()
        });
      }
    },

    // ==================== EVENT SYSTEM ====================
    
    emitEvent: (event: GameEvent) => {
      const { eventListeners } = get();
      const listeners = eventListeners.get(event.type) || [];
      
      // Call all listeners for this event type
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Event listener error for ${event.type}:`, error);
        }
      });
      
      // Add to event queue for debugging
      set(state => ({
        eventQueue: [...state.eventQueue.slice(-9), event] // Keep last 10 events
      }));
    },

    addEventListener: (eventType: string, listener: (event: GameEvent) => void) => {
      const { eventListeners } = get();
      const currentListeners = eventListeners.get(eventType) || [];
      eventListeners.set(eventType, [...currentListeners, listener]);
      
      // Return unsubscribe function
      return () => {
        const updatedListeners = eventListeners.get(eventType) || [];
        const index = updatedListeners.indexOf(listener);
        if (index > -1) {
          updatedListeners.splice(index, 1);
          eventListeners.set(eventType, updatedListeners);
        }
      };
    },

    // ==================== ANIMATION CONTROLS ====================
    
    startScoreAnimation: () => {
      set({ animatingScore: true });
      setTimeout(() => get().endScoreAnimation(), 1000);
    },
    
    endScoreAnimation: () => set({ animatingScore: false }),
    
    startStreakAnimation: () => {
      set({ animatingStreak: true });
      setTimeout(() => get().endStreakAnimation(), 1500);
    },
    
    endStreakAnimation: () => set({ animatingStreak: false }),
    
    startGoalAnimation: (goalId: string) => {
      set(state => ({
        animatingGoals: [...state.animatingGoals, goalId]
      }));
      setTimeout(() => get().endGoalAnimation(goalId), 2000);
    },
    
    endGoalAnimation: (goalId: string) => {
      set(state => ({
        animatingGoals: state.animatingGoals.filter(id => id !== goalId)
      }));
    },

    // ==================== STORAGE MANAGEMENT ====================
    
    loadDailyGoals: async () => {
      try {
        const today = new Date().toDateString();
        const lastReset = await AsyncStorage.getItem(STORAGE_KEYS.LAST_GOAL_RESET);
        
        if (lastReset === today) {
          // Load existing goals
          const savedGoals = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_GOALS);
          const savedProgress = await AsyncStorage.getItem(STORAGE_KEYS.GOALS_PROGRESS);
          
          if (savedGoals && savedProgress) {
            const goals = JSON.parse(savedGoals);
            const progress = JSON.parse(savedProgress);
            
            // Merge goals with progress
            const mergedGoals = goals.map((goal: any) => ({
              ...goal,
              ...progress[goal.id]
            }));
            
            set({ dailyGoals: mergedGoals });
            return;
          }
        }
        
        // Generate new goals for today
        const newGoals = generateDailyGoals();
        set({ dailyGoals: newGoals });
        
        // Save new goals
        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_GOALS, JSON.stringify(newGoals));
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_GOAL_RESET, today);
        await AsyncStorage.setItem(STORAGE_KEYS.GOALS_PROGRESS, JSON.stringify({}));
        
      } catch (error) {
        console.error('Failed to load daily goals:', error);
        // Fallback to generated goals
        set({ dailyGoals: generateDailyGoals() });
      }
    },

    saveToStorage: async () => {
      try {
        const { dailyGoals } = get();
        
        // Extract progress data
        const progress = dailyGoals.reduce((acc, goal) => {
          acc[goal.id] = {
            current: goal.current,
            progress: goal.progress,
            completed: goal.completed,
            claimed: goal.claimed
          };
          return acc;
        }, {} as Record<string, any>);
        
        await AsyncStorage.setItem(STORAGE_KEYS.GOALS_PROGRESS, JSON.stringify(progress));
        
      } catch (error) {
        console.error('Failed to save to storage:', error);
      }
    },

    refreshFromStorage: async () => {
      // Reload score data from EnhancedScoreService
      await EnhancedScoreService.loadSavedData();
      const scoreInfo = EnhancedScoreService.getScoreInfo();
      
      const scoreData: LiveScoreData = {
        dailyScore: scoreInfo.dailyScore,
        currentStreak: scoreInfo.currentStreak,
        highestStreak: scoreInfo.highestStreak,
        streakLevel: scoreInfo.streakLevel,
        totalQuestions: scoreInfo.totalQuestions,
        correctAnswers: scoreInfo.correctAnswers,
        accuracy: scoreInfo.accuracy,
        questionsToday: scoreInfo.questionsToday
      };
      
      get().updateScoreData(scoreData);
      await get().updateDailyGoalProgress();
    },

    reset: async () => {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.DAILY_GOALS,
        STORAGE_KEYS.GOALS_PROGRESS,
        STORAGE_KEYS.LAST_GOAL_RESET,
        STORAGE_KEYS.CLAIMED_REWARDS
      ]);
      
      set({
        scoreData: {
          dailyScore: 0,
          currentStreak: 0,
          highestStreak: 0,
          streakLevel: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          accuracy: 0,
          questionsToday: 0
        },
        dailyGoals: [],
        isInitialized: false,
        animatingScore: false,
        animatingStreak: false,
        animatingGoals: [],
        eventQueue: []
      });
    }
  }))
);

// ==================== HOOKS FOR COMPONENTS ====================

// Hook for live score data with animations
export const useLiveScore = () => {
  const scoreData = useLiveGameStore(state => state.scoreData);
  const animatingScore = useLiveGameStore(state => state.animatingScore);
  const animatingStreak = useLiveGameStore(state => state.animatingStreak);
  
  return {
    ...scoreData,
    animatingScore,
    animatingStreak
  };
};

// Hook for daily goals with real-time progress
export const useLiveDailyGoals = () => {
  const dailyGoals = useLiveGameStore(state => state.dailyGoals);
  const animatingGoals = useLiveGameStore(state => state.animatingGoals);
  const completeGoal = useLiveGameStore(state => state.completeGoal);
  const claimGoalReward = useLiveGameStore(state => state.claimGoalReward);
  
  return {
    dailyGoals,
    animatingGoals,
    completeGoal,
    claimGoalReward,
    completedCount: dailyGoals.filter(g => g.completed).length,
    totalRewards: dailyGoals.filter(g => g.completed && g.claimed).reduce((sum, g) => sum + g.reward, 0)
  };
};

// Hook for event system
export const useGameEvents = () => {
  const addEventListener = useLiveGameStore(state => state.addEventListener);
  const emitEvent = useLiveGameStore(state => state.emitEvent);
  
  return {
    addEventListener,
    emitEvent
  };
};

export default useLiveGameStore;