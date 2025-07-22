import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AudioStore {
  isMuted: boolean;
  currentTrack: string | null;
  volume: number;
  soundEffectsEnabled: boolean;
  
  // Actions
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTrack: (track: string | null) => void;
  toggleMute: () => void;
  setSoundEffectsEnabled: (enabled: boolean) => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      isMuted: false,
      currentTrack: null,
      volume: 0.7,
      soundEffectsEnabled: true,
      
      setMuted: (muted: boolean) => {
        set({ isMuted: muted });
      },
      
      setVolume: (volume: number) => {
        set({ volume: Math.max(0, Math.min(1, volume)) });
      },
      
      setCurrentTrack: (track: string | null) => {
        set({ currentTrack: track });
      },
      
      toggleMute: () => {
        set((state) => ({ isMuted: !state.isMuted }));
      },
      
      setSoundEffectsEnabled: (enabled: boolean) => {
        set({ soundEffectsEnabled: enabled });
      },
    }),
    {
      name: 'brainbites-audio',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);