import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  name: string;
  totalScore: number;
  streak: number;
  gamesPlayed: number;
  correctAnswers: number;
  totalQuestions: number;
  dailyGoal: number;
  dailyProgress: number;
  lastPlayedDate: string;
  achievements: string[];
  bestStreak: number;
}

interface UserStore {
  user: User;
  updateScore: (points: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  updateDailyProgress: () => void;
  incrementGamesPlayed: () => void;
  incrementCorrectAnswers: () => void;
  incrementTotalQuestions: () => void;
  addAchievement: (achievement: string) => void;
  resetUser: () => void;
}

const defaultUser: User = {
  name: 'CaBBy',
  totalScore: 0,
  streak: 0,
  gamesPlayed: 0,
  correctAnswers: 0,
  totalQuestions: 0,
  dailyGoal: 5,
  dailyProgress: 0,
  lastPlayedDate: new Date().toDateString(),
  achievements: [],
  bestStreak: 0,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: defaultUser,
      
      updateScore: (points: number) => {
        set((state) => ({
          user: {
            ...state.user,
            totalScore: state.user.totalScore + points,
          },
        }));
      },
      
      incrementStreak: () => {
        set((state) => {
          const newStreak = state.user.streak + 1;
          return {
            user: {
              ...state.user,
              streak: newStreak,
              bestStreak: Math.max(newStreak, state.user.bestStreak),
            },
          };
        });
      },
      
      resetStreak: () => {
        set((state) => ({
          user: {
            ...state.user,
            streak: 0,
          },
        }));
      },
      
      updateDailyProgress: () => {
        const today = new Date().toDateString();
        set((state) => {
          if (state.user.lastPlayedDate !== today) {
            return {
              user: {
                ...state.user,
                dailyProgress: 1,
                lastPlayedDate: today,
              },
            };
          }
          return {
            user: {
              ...state.user,
              dailyProgress: Math.min(state.user.dailyProgress + 1, state.user.dailyGoal),
            },
          };
        });
      },
      
      incrementGamesPlayed: () => {
        set((state) => ({
          user: {
            ...state.user,
            gamesPlayed: state.user.gamesPlayed + 1,
          },
        }));
      },
      
      incrementCorrectAnswers: () => {
        set((state) => ({
          user: {
            ...state.user,
            correctAnswers: state.user.correctAnswers + 1,
          },
        }));
      },
      
      incrementTotalQuestions: () => {
        set((state) => ({
          user: {
            ...state.user,
            totalQuestions: state.user.totalQuestions + 1,
          },
        }));
      },
      
      addAchievement: (achievement: string) => {
        set((state) => ({
          user: {
            ...state.user,
            achievements: [...state.user.achievements, achievement],
          },
        }));
      },
      
      resetUser: () => {
        set({ user: defaultUser });
      },
    }),
    {
      name: 'brainbites-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);