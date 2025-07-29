import { NativeEventEmitter, NativeModules } from 'react-native';

export enum TimerState {
  INACTIVE = 'INACTIVE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  FOREGROUND = 'FOREGROUND',
  DEBT_MODE = 'DEBT_MODE',
}

export interface TimerStatus {
  state: TimerState;
  remainingTime: number;
  debtTime: number;
  isInDebtMode: boolean;
  isPaused: boolean;
  todayScreenTime: number;
  weeklyScreenTime: number;
}

interface ScreenTimeModule {
  addTimeFromQuiz(minutes: number): Promise<boolean>;
  addTimeFromGoal(hours: number): Promise<boolean>;
  startTimer(): Promise<boolean>;
  pauseTimer(): Promise<boolean>;
  stopTimer(): Promise<boolean>;
  getTimerState(): Promise<TimerStatus>;
}

const { ScreenTimeModule: NativeScreenTimeModule } = NativeModules;

if (!NativeScreenTimeModule) {
  throw new Error('ScreenTimeModule not found. Check native module installation.');
}

export const ScreenTimeModule: ScreenTimeModule = NativeScreenTimeModule;

const eventEmitter = new NativeEventEmitter(NativeScreenTimeModule);

export const useScreenTimeEvents = (
  onTimerStateChanged: (state: TimerStatus) => void
) => {
  const subscription = eventEmitter.addListener(
    'onTimerStateChanged',
    onTimerStateChanged
  );

  return () => {
    subscription.remove();
  };
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
}; 