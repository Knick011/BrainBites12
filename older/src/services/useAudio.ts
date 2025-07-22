import { useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { audioService } from './AudioService';
import { useAudioStore } from '../store/audioStore';

export const useAudio = () => {
  const { isMuted, volume } = useAudioStore();
  
  useEffect(() => {
    audioService.setVolume(volume);
  }, [volume]);
  
  useEffect(() => {
    if (isMuted) {
      audioService.stopAllSounds();
    }
  }, [isMuted]);
  
  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        audioService.pauseMusic();
      } else if (nextAppState === 'active') {
        if (!isMuted) {
          audioService.resumeMusic();
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [isMuted]);
  
  const playSound = useCallback((soundKey: string) => {
    if (!isMuted) {
      audioService.playSound(soundKey);
    }
  }, [isMuted]);
  
  const playMusic = useCallback((musicKey: string) => {
    if (!isMuted) {
      audioService.playMusic(musicKey);
    }
  }, [isMuted]);
  
  return {
    playSound,
    playMusic,
    stopMusic: audioService.stopMusic,
    stopAllSounds: audioService.stopAllSounds,
  };
};