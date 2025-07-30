// src/services/DailyGoalsService.ts
// ✅ COMPREHENSIVE DAILY GOALS SERVICE - FIXED VERSION
import AsyncStorage from '@react-native-async-storage/async-storage';
import EnhancedScoreService from './EnhancedScoreService';
import TimerIntegrationService from './TimerIntegrationService';

export interface DailyGoal {
  id: string;
  type: 'questions' | 'streak' | 'accuracy' | 'difficulty' | 'category' | 'perfect';
  target: number;
  questionsRequired?: number;
  reward: number; // in seconds
  title: string;
  description: string;
  icon: string;
  color: string;
  current: number;
  progress: number; // 0-100
  completed: boolean;
  claimed: boolean;
  questionsAnswered?: number;
}

const DAILY_GOALS_POOL: Omit<DailyGoal, 'current' | 'progress' | 'completed' | 'claimed'>[] = [
  {
    id: 'questions_20',
    type: 'questions',
    target: 20,
    reward: 1200, // 20 minutes
    title: 'Quiz Starter',
    description: 'Answer 20 questions',
    icon: 'help-circle-outline',
    color: '#4CAF50'
  },
  {
    id: 'questions_30',
    type: 'questions',
    target: 30,
    reward: 1800, // 30 minutes
    title: 'Quiz Master',
    description: 'Answer 30 questions',
    icon: 'help-circle-outline',
    color: '#4CAF50'
  },
  {
    id: 'questions_50',
    type: 'questions',
    target: 50,
    reward: 3600, // 60 minutes
    title: 'Knowledge Seeker',
    description: 'Answer 50 questions',
    icon: 'help-circle-multiple',
    color: '#2E7D32'
  },
  {
    id: 'streak_5',
    type: 'streak',
    target: 5,
    reward: 900, // 15 minutes
    title: 'Getting Hot',
    description: 'Achieve 5 question streak',
    icon: 'fire',
    color: '#FF9800'
  },
  {
    id: 'streak_10',
    type: 'streak',
    target: 10,
    reward: 2700, // 45 minutes
    title: 'Streak Champion',
    description: 'Achieve 10 question streak',
    icon: 'fire',
    color: '#FF9F1C'
  },
  {
    id: 'streak_15',
    type: 'streak',
    target: 15,
    reward: 3600, // 60 minutes
    title: 'Streak Master',
    description: 'Achieve 15 question streak',
    icon: 'fire',
    color: '#F57C00'
  },
  {
    id: 'accuracy_70',
    type: 'accuracy',
    target: 70,
    questionsRequired: 15,
    reward: 1800, // 30 minutes
    title: 'Good Aim',
    description: 'Get 70% accuracy (min 15 questions)',
    icon: 'target',
    color: '#2196F3'
  },
  {
    id: 'accuracy_80',
    type: 'accuracy',
    target: 80,
    questionsRequired: 20,
    reward: 3600, // 60 minutes
    title: 'Precision Expert',
    description: 'Get 80% accuracy (min 20 questions)',
    icon: 'target',
    color: '#1976D2'
  },
  {
    id: 'hard_difficulty',
    type: 'difficulty',
    target: 10,
    questionsRequired: 10,
    reward: 2700, // 45 minutes
    title: 'Challenge Accepted',
    description: 'Answer 10 hard questions correctly',
    icon: 'trophy-outline',
    color: '#E91E63'
  },
  {
    id: 'perfect_5',
    type: 'perfect',
    target: 5,
    reward: 1200, // 20 minutes
    title: 'Perfect Start',
    description: 'Get 5 questions correct in a row',
    icon: 'star-circle-outline',
    color: '#FFD700'
  },
  {
    id: 'perfect_10',
    type: 'perfect',
    target: 10,
    reward: 2400, // 40 minutes
    title: 'Perfect Run',
    description: 'Get 10 questions correct in a row',
    icon: 'star-circle',
    color: '#FFC107'
  }
];

class DailyGoalsService {
  private static instance: DailyGoalsService;
  private goals: DailyGoal[] = [];
  private listeners: Array<(goals: DailyGoal[]) => void> = [];
  private isInitialized = false;

  static getInstance(): DailyGoalsService {
    if (!DailyGoalsService.instance) {
      DailyGoalsService.instance = new DailyGoalsService();
    }
    return DailyGoalsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🎯 [DailyGoals] Initializing service...');
    
    try {
      await this.loadOrGenerateGoals();
      this.isInitialized = true;
      console.log('✅ [DailyGoals] Service initialized with', this.goals.length, 'goals');
    } catch (error) {
      console.error('❌ [DailyGoals] Failed to initialize:', error);
      // Fallback to generated goals
      this.goals = this.generateDailyGoals();
      this.isInitialized = true;
    }
  }

  private async loadOrGenerateGoals(): Promise<void> {
    const today = new Date().toDateString();
    const lastResetDate = await AsyncStorage.getItem('@BrainBites:lastGoalReset');
    
    console.log('🎯 [DailyGoals] Today:', today, 'Last reset:', lastResetDate);

    if (lastResetDate === today) {
      // Load existing goals
      const savedGoals = await AsyncStorage.getItem('@BrainBites:dailyGoals');
      if (savedGoals) {
        this.goals = JSON.parse(savedGoals);
        console.log('✅ [DailyGoals] Loaded existing goals');
        return;
      }
    }

    // Generate new goals for today
    console.log('🎯 [DailyGoals] Generating new goals for today');
    this.goals = this.generateDailyGoals();
    
    // Save new goals
    await AsyncStorage.setItem('@BrainBites:dailyGoals', JSON.stringify(this.goals));
    await AsyncStorage.setItem('@BrainBites:lastGoalReset', today);
    
    console.log('✅ [DailyGoals] Generated and saved new goals');
  }

  private generateDailyGoals(): DailyGoal[] {
    // Shuffle the pool and select 3 different types of goals
    const shuffled = [...DAILY_GOALS_POOL].sort(() => 0.5 - Math.random());
    const selected: DailyGoal[] = [];
    const usedTypes = new Set<string>();

    // Try to get different types of goals
    for (const goalTemplate of shuffled) {
      if (selected.length >= 3) break;
      
      // Prefer different types, but allow duplicates if needed
      if (!usedTypes.has(goalTemplate.type) || selected.length === 0) {
        selected.push({
          ...goalTemplate,
          current: 0,
          progress: 0,
          completed: false,
          claimed: false,
          questionsAnswered: 0
        });
        usedTypes.add(goalTemplate.type);
      }
    }

    // If we don't have 3 goals, fill with remaining goals
    while (selected.length < 3 && selected.length < shuffled.length) {
      const remaining = shuffled.filter(g => !selected.find(s => s.id === g.id));
      if (remaining.length > 0) {
        const goalTemplate = remaining[0];
        selected.push({
          ...goalTemplate,
          current: 0,
          progress: 0,
          completed: false,
          claimed: false,
          questionsAnswered: 0
        });
      } else {
        break;
      }
    }

    console.log('🎯 [DailyGoals] Generated goals:', selected.map(g => `${g.title} (${g.type})`));
    return selected;
  }

  async updateProgress(questionData: {
    isCorrect: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    category?: string;
    currentStreak: number;
    todayAccuracy: number;
    todayQuestions: number;
  }): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let hasChanges = false;

    for (const goal of this.goals) {
      if (goal.completed) continue;

      const oldProgress = goal.progress;

      switch (goal.type) {
        case 'questions':
          goal.current = questionData.todayQuestions;
          goal.progress = Math.min(100, (goal.current / goal.target) * 100);
          break;

        case 'streak':
          goal.current = Math.max(goal.current, questionData.currentStreak);
          goal.progress = Math.min(100, (goal.current / goal.target) * 100);
          break;

        case 'accuracy':
          if (questionData.todayQuestions >= (goal.questionsRequired || 0)) {
            goal.current = questionData.todayAccuracy;
            goal.progress = goal.current >= goal.target ? 100 : (goal.current / goal.target) * 100;
            goal.questionsAnswered = questionData.todayQuestions;
          }
          break;

        case 'difficulty':
          if (questionData.isCorrect && questionData.difficulty === 'hard') {
            goal.current = Math.min(goal.current + 1, goal.target);
            goal.progress = (goal.current / goal.target) * 100;
          }
          break;

        case 'perfect':
          goal.current = Math.max(goal.current, questionData.currentStreak);
          goal.progress = Math.min(100, (goal.current / goal.target) * 100);
          break;
      }

      // Check if goal is completed
      if (!goal.completed && goal.progress >= 100) {
        goal.completed = true;
        console.log(`🎉 [DailyGoals] Goal completed: ${goal.title}`);
      }

      if (goal.progress !== oldProgress) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await this.saveGoals();
      this.notifyListeners();
    }
  }

  async claimReward(goalId: string): Promise<boolean> {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal || !goal.completed || goal.claimed) {
      return false;
    }

    try {
      // Add time to timer using updated integration service
      // Convert reward from seconds to minutes
      const timeInMinutes = Math.floor(goal.reward / 60);
      console.log(`🎯 [DailyGoals] Claiming reward: ${timeInMinutes} minutes for ${goal.title}`);
      
      // Initialize timer integration if needed
      await TimerIntegrationService.initialize();
      
      const success = await TimerIntegrationService.addTimeFromGoal(timeInMinutes);
      
      if (success) {
        goal.claimed = true;
        await this.saveGoals();
        this.notifyListeners();
        
        console.log(`✅ [DailyGoals] Successfully claimed ${timeInMinutes}m for ${goal.title}`);
        return true;
      } else {
        console.error(`❌ [DailyGoals] Failed to add time for ${goal.title}`);
        return false;
      }
    } catch (error) {
      console.error('❌ [DailyGoals] Error claiming reward:', error);
      return false;
    }
  }

  private async saveGoals(): Promise<void> {
    try {
      await AsyncStorage.setItem('@BrainBites:dailyGoals', JSON.stringify(this.goals));
    } catch (error) {
      console.error('❌ [DailyGoals] Failed to save goals:', error);
    }
  }

  getGoals(): DailyGoal[] {
    return [...this.goals];
  }

  getCompletedCount(): number {
    return this.goals.filter(g => g.completed).length;
  }

  getClaimedCount(): number {
    return this.goals.filter(g => g.claimed).length;
  }

  getTotalRewards(): number {
    return this.goals
      .filter(g => g.claimed)
      .reduce((total, g) => total + g.reward, 0);
  }

  addListener(callback: (goals: DailyGoal[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.goals]);
      } catch (error) {
        console.error('❌ [DailyGoals] Error in listener:', error);
      }
    });
  }

  async resetForTesting(): Promise<void> {
    console.log('🧪 [DailyGoals] Resetting for testing');
    await AsyncStorage.removeItem('@BrainBites:dailyGoals');
    await AsyncStorage.removeItem('@BrainBites:lastGoalReset');
    this.goals = [];
    this.isInitialized = false;
    await this.initialize();
  }
}

export default DailyGoalsService.getInstance();