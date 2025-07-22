// src/services/SoundService.ts
// ✅ FIXES: "playButtonClick is not a function", "Sound buttonPress not loaded", missing volume methods
// console.log: "This SoundService provides all methods expected by the app and gracefully handles library failures"

import { Platform } from 'react-native';

// Safe Sound library import with error handling
let Sound: any = null;
let soundAvailable = false;

// Initialize sound library safely
const initializeSoundLibrary = () => {
  try {
    console.log('🔊 Attempting to load react-native-sound library...');
    Sound = require('react-native-sound').default || require('react-native-sound');
    
    if (Sound && typeof Sound.setCategory === 'function') {
      Sound.setCategory('Playback');
      soundAvailable = true;
      console.log('✅ react-native-sound library loaded successfully');
    } else {
      console.log('⚠️ react-native-sound library found but setCategory not available');
      soundAvailable = false;
    }
  } catch (error: any) {
    console.log('❌ react-native-sound not available:', error?.message || error);
    soundAvailable = false;
  }
};

// Initialize immediately
initializeSoundLibrary();

type SoundKey = 'buttonPress' | 'correct' | 'incorrect' | 'streak' | 'gameMusic' | 'menuMusic';

class SoundServiceClass {
  private sounds: Map<SoundKey, any> = new Map();
  private musicInstance: any = null;
  private isMusicEnabled: boolean = true;
  private isSoundEnabled: boolean = true;
  private musicVolume: number = 0.5;
  private effectsVolume: number = 0.7;
  private isInitialized: boolean = false;
  
  // Sound file names for native bundle
  private readonly soundFileNames: Record<SoundKey, string> = {
    buttonPress: 'buttonpress',
    correct: 'correct',
    incorrect: 'incorrect',
    streak: 'streak',
    gameMusic: 'gamemusic',
    menuMusic: 'menumusic',
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔊 SoundService already initialized');
      return;
    }
    
    console.log('🚀 Initializing SoundService...');
    
    if (!soundAvailable || !Sound) {
      console.log('⚠️ Sound library not available, sounds will be disabled');
      this.isInitialized = true;
      return;
    }
    
    try {
      // Load all sound files
      const loadPromises = Object.entries(this.soundFileNames).map(([key, filename]) => 
        this.loadSound(key as SoundKey, filename).catch((error) => {
          console.log(`⚠️ Failed to load sound: ${key} - ${error}`);
        })
      );
      
      await Promise.all(loadPromises);
      this.isInitialized = true;
      console.log('✅ SoundService initialized successfully');
    } catch (error) {
      console.log('❌ Failed to initialize sounds:', error);
      this.isInitialized = true; // Mark as initialized to prevent retries
    }
  }

  private loadSound(key: SoundKey, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!Sound || !soundAvailable) {
        console.log(`⚠️ Sound library not available, ${key} will be disabled`);
        resolve();
        return;
      }

      try {
        const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error: any) => {
          if (error) {
            console.log(`⚠️ Failed to load sound ${filename}:`, error.message);
            resolve(); // Don't fail initialization
          } else {
            this.sounds.set(key, sound);
            console.log(`✅ Successfully loaded sound: ${key}`);
            resolve();
          }
        });
      } catch (error) {
        console.log(`❌ Error creating sound ${key}:`, error);
        resolve(); // Don't fail initialization
      }
    });
  }

  private playSound(key: SoundKey, options?: { volume?: number }): void {
    if (!this.isSoundEnabled || !soundAvailable) {
      console.log(`🔇 Sound disabled or unavailable, skipping: ${key}`);
      return;
    }
    
    const sound = this.sounds.get(key);
    if (!sound) {
      console.log(`⚠️ Sound ${key} not loaded or not available`);
      return;
    }
    
    try {
      // Reset to beginning
      if (sound.setCurrentTime) {
        sound.setCurrentTime(0);
      }
      
      // Set volume
      const volume = options?.volume ?? this.effectsVolume;
      if (sound.setVolume) {
        sound.setVolume(volume);
      }
      
      // Play the sound
      sound.play((success: boolean) => {
        if (success) {
          console.log(`🔊 Successfully played sound: ${key}`);
        } else {
          console.log(`⚠️ Failed to play sound: ${key}`);
        }
      });
    } catch (error) {
      console.log(`❌ Error playing sound ${key}:`, error);
    }
  }

  // ===== PUBLIC METHODS =====
  // These are the methods your app expects to exist

  // Button sound methods
  playButtonPress(): void {
    console.log('🔊 playButtonPress called');
    this.playSound('buttonPress', { volume: this.effectsVolume });
  }

  playButtonClick(): void {
    console.log('🔊 playButtonClick called (alias for playButtonPress)');
    this.playButtonPress(); // Alias for playButtonPress
  }

  // Game sound methods
  playCorrect(): void {
    console.log('🔊 playCorrect called');
    this.playSound('correct', { volume: this.effectsVolume });
  }

  playIncorrect(): void {
    console.log('🔊 playIncorrect called');
    this.playSound('incorrect', { volume: this.effectsVolume });
  }

  playStreak(): void {
    console.log('🔊 playStreak called');
    this.playSound('streak', { volume: this.effectsVolume });
  }

  // Music methods
  startMenuMusic(): void {
    console.log('🎵 startMenuMusic called');
    if (!this.isMusicEnabled || !soundAvailable) {
      console.log('🔇 Music disabled or unavailable');
      return;
    }
    
    this.stopMusic();
    
    const music = this.sounds.get('menuMusic');
    if (!music) {
      console.log('⚠️ Menu music not available');
      return;
    }
    
    try {
      if (music.setNumberOfLoops) {
        music.setNumberOfLoops(-1); // Loop indefinitely
      }
      if (music.setVolume) {
        music.setVolume(this.musicVolume);
      }
      if (music.setCurrentTime) {
        music.setCurrentTime(0);
      }
      
      music.play((success: boolean) => {
        if (success) {
          this.musicInstance = music;
          console.log('🎵 Menu music started successfully');
        } else {
          console.log('⚠️ Failed to play menu music');
        }
      });
    } catch (error) {
      console.log('❌ Error starting menu music:', error);
    }
  }

  startGameMusic(): void {
    console.log('🎵 startGameMusic called');
    if (!this.isMusicEnabled || !soundAvailable) {
      console.log('🔇 Music disabled or unavailable');
      return;
    }
    
    this.stopMusic();
    
    const music = this.sounds.get('gameMusic');
    if (!music) {
      console.log('⚠️ Game music not available');
      return;
    }
    
    try {
      if (music.setNumberOfLoops) {
        music.setNumberOfLoops(-1); // Loop indefinitely
      }
      if (music.setVolume) {
        music.setVolume(this.musicVolume);
      }
      if (music.setCurrentTime) {
        music.setCurrentTime(0);
      }
      
      music.play((success: boolean) => {
        if (success) {
          this.musicInstance = music;
          console.log('🎵 Game music started successfully');
        } else {
          console.log('⚠️ Failed to play game music');
        }
      });
    } catch (error) {
      console.log('❌ Error starting game music:', error);
    }
  }

  stopMusic(): void {
    console.log('🔇 stopMusic called');
    if (this.musicInstance && soundAvailable) {
      try {
        this.musicInstance.stop();
        console.log('✅ Music stopped successfully');
      } catch (error) {
        console.log('❌ Error stopping music:', error);
      }
      this.musicInstance = null;
    }
  }

  pauseMusic(): void {
    console.log('⏸️ pauseMusic called');
    if (this.musicInstance && soundAvailable) {
      try {
        if (this.musicInstance.pause) {
          this.musicInstance.pause();
          console.log('✅ Music paused successfully');
        }
      } catch (error) {
        console.log('❌ Error pausing music:', error);
      }
    }
  }

  resumeMusic(): void {
    console.log('▶️ resumeMusic called');
    if (this.musicInstance && this.isMusicEnabled && soundAvailable) {
      try {
        this.musicInstance.play();
        console.log('✅ Music resumed successfully');
      } catch (error) {
        console.log('❌ Error resuming music:', error);
      }
    }
  }

  // ===== SETTINGS METHODS =====
  // These methods are called by SettingsScreen

  setMusicEnabled(enabled: boolean): void {
    console.log(`🎵 setMusicEnabled: ${enabled}`);
    this.isMusicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  setSoundEnabled(enabled: boolean): void {
    console.log(`🔊 setSoundEnabled: ${enabled}`);
    this.isSoundEnabled = enabled;
  }

  setMusicVolume(volume: number): void {
    console.log(`🎵 setMusicVolume: ${volume}`);
    this.musicVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    
    // Apply to currently playing music
    if (this.musicInstance && soundAvailable) {
      try {
        if (this.musicInstance.setVolume) {
          this.musicInstance.setVolume(this.musicVolume);
        }
      } catch (error) {
        console.log('❌ Error setting music volume:', error);
      }
    }
  }

  setEffectsVolume(volume: number): void {
    console.log(`🔊 setEffectsVolume: ${volume}`);
    this.effectsVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
  }

  // ===== GETTERS =====
  // These methods are called to read current settings

  getMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getEffectsVolume(): number {
    return this.effectsVolume;
  }

  // ===== UTILITY METHODS =====

  isReady(): boolean {
    return this.isInitialized;
  }

  isSoundLibraryAvailable(): boolean {
    return soundAvailable;
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      soundLibraryAvailable: soundAvailable,
      soundsLoaded: this.sounds.size,
      musicEnabled: this.isMusicEnabled,
      soundEnabled: this.isSoundEnabled,
      musicVolume: this.musicVolume,
      effectsVolume: this.effectsVolume,
    };
  }

  release(): void {
    console.log('🗑️ Releasing SoundService resources...');
    
    // Stop any playing music
    this.stopMusic();
    
    // Release all sound resources
    if (soundAvailable) {
      this.sounds.forEach((sound, key) => {
        try {
          if (sound && sound.release) {
            sound.release();
            console.log(`✅ Released sound: ${key}`);
          }
        } catch (error) {
          console.log(`❌ Error releasing sound ${key}:`, error);
        }
      });
    }
    
    // Clear all references
    this.sounds.clear();
    this.isInitialized = false;
    this.musicInstance = null;
    
    console.log('✅ SoundService resources released successfully');
  }
}

// Export singleton instance
export default new SoundServiceClass();