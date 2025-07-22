// Simple Timer Service (JavaScript-only, no native modules)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

export interface TimerState {
  remainingTime: number;
  negativeTime: number;
  isTracking: boolean;
  isAppForeground: boolean;
}

class TimerServiceClass {
  private listeners: Array<(state: TimerState) => void> = [];
  private currentState: TimerState = {
    remainingTime: 300, // Start with 5 minutes
    negativeTime: 0,
    isTracking: false,
    isAppForeground: true,
  };
  private appStateSubscription: any;
  private interval: NodeJS.Timeout | null = null;
  private lastUpdateTime: number = Date.now();

  private readonly STORAGE_KEY = '@BrainBites:timerState';

  async init() {
    console.log('Initializing Simple TimerService (JavaScript-only)');
    
    // Load saved state
    await this.loadState();
    
    // Listen to app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Start the timer
    this.startTimer();
  }

  private async loadState() {
    try {
      const savedState = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.currentState = { ...this.currentState, ...parsed };
      }
    } catch (error) {
      console.log('Could not load timer state:', error);
    }
  }

  private async saveState() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentState));
    } catch (error) {
      console.log('Could not save timer state:', error);
    }
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log('App state changed to:', nextAppState);
    
    const wasBackground = !this.currentState.isAppForeground;
    const isNowForeground = nextAppState === 'active';
    
    this.currentState.isAppForeground = isNowForeground;
    
    // If returning from background, calculate elapsed time
    if (wasBackground && isNowForeground) {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - this.lastUpdateTime) / 1000);
      
      // Only count time if we were tracking
      if (this.currentState.isTracking && elapsedSeconds > 0) {
        if (this.currentState.remainingTime > 0) {
          this.currentState.remainingTime = Math.max(0, this.currentState.remainingTime - elapsedSeconds);
        }
        if (this.currentState.remainingTime === 0) {
          this.currentState.negativeTime += elapsedSeconds;
        }
      }
    }
    
    this.lastUpdateTime = Date.now();
    this.notifyListeners();
    this.saveState();
  };

  private startTimer() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      if (this.currentState.isTracking && this.currentState.isAppForeground) {
        if (this.currentState.remainingTime > 0) {
          this.currentState.remainingTime -= 1;
        } else {
          this.currentState.negativeTime += 1;
        }
        
        this.notifyListeners();
        this.saveState();
      }
    }, 1000);
  }

  addListener(callback: (state: TimerState) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.currentState);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  async addTime(seconds: number) {
    console.log(`Adding ${seconds} seconds to timer`);
    this.currentState.remainingTime += seconds;
    
    // If we had negative time, reduce it first
    if (this.currentState.negativeTime > 0) {
      const reductionAmount = Math.min(this.currentState.negativeTime, seconds);
      this.currentState.negativeTime -= reductionAmount;
      this.currentState.remainingTime -= reductionAmount;
    }
    
    this.notifyListeners();
    this.saveState();
    return this.currentState.remainingTime;
  }

  async startTracking() {
    console.log('Starting timer tracking');
    this.currentState.isTracking = true;
    this.lastUpdateTime = Date.now();
    this.notifyListeners();
    this.saveState();
    return true;
  }

  async stopTracking() {
    console.log('Stopping timer tracking');
    this.currentState.isTracking = false;
    this.notifyListeners();
    this.saveState();
    return true;
  }

  async getRemainingTime() {
    return {
      remainingTime: this.currentState.remainingTime,
      negativeTime: this.currentState.negativeTime,
    };
  }

  async resetTimer() {
    console.log('Resetting timer');
    this.currentState = {
      remainingTime: 300, // 5 minutes
      negativeTime: 0,
      isTracking: false,
      isAppForeground: this.currentState.isAppForeground,
    };
    this.notifyListeners();
    this.saveState();
    return true;
  }

  getCurrentState() {
    return { ...this.currentState };
  }

  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    this.listeners = [];
  }
}

export const TimerService = new TimerServiceClass();