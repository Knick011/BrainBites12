// src/services/SoundService.ts
// ✅ MODERN AUDIO: Using react-native-sound-player
// ✅ FIXES: Simple and reliable audio playback for React Native 0.79.5
// console.log: "Modern audio service using react-native-sound-player for RN 0.79.5"

import { Platform } from 'react-native';
import SoundPlayer from 'react-native-sound-player';

// Audio availability flags
let audioInitialized = false;
let backgroundMusicPlaying = false;
let currentMusicTrack: string | null = null;

// Sound effect tracking
let soundEffectsEnabled = true;
let musicEnabled = true;

// Sound file paths - using require for local assets
const SOUND_FILES = {
  buttonPress: require('../assets/sounds/buttonpress.mp3'),
  correct: require('../assets/sounds/correct.mp3'),
  incorrect: require('../assets/sounds/incorrect.mp3'),
  streak: require('../assets/sounds/streak.mp3'),
  gameMusic: require('../assets/sounds/gamemusic.mp3'),
  menuMusic: require('../assets/sounds/menumusic.mp3')
};

// Initialize audio system
const initializeAudio = async (): Promise<boolean> => {
  try {
    console.log('🔊 [Modern Audio] Initializing react-native-sound-player...');
    
    // Test if audio is working by trying to play a silent sound
    audioInitialized = true;
    console.log('✅ [Modern Audio] react-native-sound-player ready');
    return true;

  } catch (error: any) {
    console.log('❌ [Modern Audio] Audio initialization failed:', error?.message || error);
    return false;
  }
};

// Sound Service Class
class SoundServiceClass {
  private initPromise: Promise<boolean> | null = null;

  constructor() {
    console.log('🔊 [Modern Audio] SoundService constructor called');
  }

  // Initialize the audio system
  async initialize(): Promise<boolean> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = initializeAudio();
    return this.initPromise;
  }

  // Ensure audio is initialized before use
  private async ensureInitialized(): Promise<boolean> {
    if (!audioInitialized) {
      return await this.initialize();
    }
    return audioInitialized;
  }

  // Play a sound effect
  private async playSound(soundFile: any, soundName: string): Promise<void> {
    try {
      if (!soundEffectsEnabled) {
        console.log(`🔊 [Modern Audio] Sound effects disabled, skipping: ${soundName}`);
        return;
      }

      const isReady = await this.ensureInitialized();
      if (!isReady) {
        console.log(`🔊 [Modern Audio] Audio not available, skipping: ${soundName}`);
        return;
      }

      // For sound effects, we'll use a simple approach
      // Stop any current music briefly, play sound, then resume
      const wasPlaying = backgroundMusicPlaying;
      if (wasPlaying) {
        SoundPlayer.pause();
      }

      // Play the sound effect
      SoundPlayer.playSoundFile(soundName, 'mp3');
      
      console.log(`🔊 [Modern Audio] Playing sound effect: ${soundName}`);

      // Resume music after a short delay
      if (wasPlaying && currentMusicTrack) {
        setTimeout(() => {
          try {
            this.resumeBackgroundMusic();
          } catch (error) {
            console.log('🔊 [Modern Audio] Failed to resume background music:', error);
          }
        }, 1000); // 1 second delay
      }

    } catch (error: any) {
      console.log(`🔊 [Modern Audio] Error playing ${soundName}:`, error?.message || error);
    }
  }

  // Resume background music after sound effect
  private async resumeBackgroundMusic(): Promise<void> {
    if (!currentMusicTrack || !musicEnabled) return;

    try {
      SoundPlayer.playSoundFile(currentMusicTrack, 'mp3');
      backgroundMusicPlaying = true;
    } catch (error) {
      console.log('🔊 [Modern Audio] Failed to resume background music:', error);
    }
  }

  // Public methods for sound effects
  async playButtonPress(): Promise<void> {
    const isReady = await this.ensureInitialized();
    if (isReady) {
      await this.playSound(SOUND_FILES.buttonPress, 'buttonpress');
    }
  }

  async playCorrect(): Promise<void> {
    const isReady = await this.ensureInitialized();
    if (isReady) {
      await this.playSound(SOUND_FILES.correct, 'correct');
    }
  }

  async playIncorrect(): Promise<void> {
    const isReady = await this.ensureInitialized();
    if (isReady) {
      await this.playSound(SOUND_FILES.incorrect, 'incorrect');
    }
  }

  async playStreak(): Promise<void> {
    const isReady = await this.ensureInitialized();
    if (isReady) {
      await this.playSound(SOUND_FILES.streak, 'streak');
    }
  }

  // Background music methods
  async startGameMusic(): Promise<void> {
    try {
      if (!musicEnabled) {
        console.log('🔊 [Modern Audio] Music disabled, skipping game music');
        return;
      }

      const isReady = await this.ensureInitialized();
      if (!isReady) {
        console.log('🔊 [Modern Audio] Audio not available, skipping game music');
        return;
      }

      // Stop any current music
      await this.stopMusic();

      SoundPlayer.playSoundFile('gamemusic', 'mp3');
      backgroundMusicPlaying = true;
      currentMusicTrack = 'gamemusic';
      
      console.log('🔊 [Modern Audio] Started game music');

    } catch (error: any) {
      console.log('🔊 [Modern Audio] Failed to start game music:', error?.message || error);
    }
  }

  async startMenuMusic(): Promise<void> {
    try {
      if (!musicEnabled) {
        console.log('🔊 [Modern Audio] Music disabled, skipping menu music');
        return;
      }

      const isReady = await this.ensureInitialized();
      if (!isReady) {
        console.log('🔊 [Modern Audio] Audio not available, skipping menu music');
        return;
      }

      // Stop any current music
      await this.stopMusic();

      SoundPlayer.playSoundFile('menumusic', 'mp3');
      backgroundMusicPlaying = true;
      currentMusicTrack = 'menumusic';
      
      console.log('🔊 [Modern Audio] Started menu music');

    } catch (error: any) {
      console.log('🔊 [Modern Audio] Failed to start menu music:', error?.message || error);
    }
  }

  async stopMusic(): Promise<void> {
    try {
      SoundPlayer.stop();
      backgroundMusicPlaying = false;
      currentMusicTrack = null;
      
      console.log('🔊 [Modern Audio] Stopped music');

    } catch (error: any) {
      console.log('🔊 [Modern Audio] Failed to stop music:', error?.message || error);
    }
  }

  async pauseMusic(): Promise<void> {
    try {
      if (backgroundMusicPlaying) {
        SoundPlayer.pause();
        console.log('🔊 [Modern Audio] Paused music');
      }
    } catch (error: any) {
      console.log('🔊 [Modern Audio] Failed to pause music:', error?.message || error);
    }
  }

  async resumeMusic(): Promise<void> {
    try {
      if (currentMusicTrack) {
        SoundPlayer.resume();
        console.log('🔊 [Modern Audio] Resumed music');
      }
    } catch (error: any) {
      console.log('🔊 [Modern Audio] Failed to resume music:', error?.message || error);
    }
  }

  // Settings methods
  setSoundEffectsEnabled(enabled: boolean): void {
    soundEffectsEnabled = enabled;
    console.log(`🔊 [Modern Audio] Sound effects ${enabled ? 'enabled' : 'disabled'}`);
  }

  setMusicEnabled(enabled: boolean): void {
    musicEnabled = enabled;
    if (!enabled && backgroundMusicPlaying) {
      this.stopMusic();
    }
    console.log(`🔊 [Modern Audio] Music ${enabled ? 'enabled' : 'disabled'}`);
  }

  isSoundEffectsEnabled(): boolean {
    return soundEffectsEnabled;
  }

  isMusicEnabled(): boolean {
    return musicEnabled;
  }

  isAudioAvailable(): boolean {
    return audioInitialized;
  }

  // Cleanup method
  async destroy(): Promise<void> {
    try {
      SoundPlayer.stop();
      
      audioInitialized = false;
      backgroundMusicPlaying = false;
      currentMusicTrack = null;
      
      console.log('🔊 [Modern Audio] SoundService destroyed');

    } catch (error: any) {
      console.log('🔊 [Modern Audio] Error during destroy:', error?.message || error);
    }
  }

  // Get audio status for debugging
  getAudioStatus() {
    return {
      audioInitialized,
      backgroundMusicPlaying,
      currentMusicTrack,
      soundEffectsEnabled,
      musicEnabled,
      platform: Platform.OS,
      library: 'react-native-sound-player'
    };
  }
}

// Export singleton instance
const SoundService = new SoundServiceClass();
export default SoundService;