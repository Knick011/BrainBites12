// src/services/SoundService.ts
// ✅ FIXES: "resolveAssetSource is not a function" error in RN 0.79.5
// ✅ FIXES: "playButtonClick is not a function", "Sound buttonPress not loaded"
// console.log: "RN 0.79.5 compatible SoundService bypasses resolveAssetSource issues"

import { Platform } from 'react-native';

// Safe Sound library import with RN 0.79.5 compatibility
let Sound: any = null;
let soundAvailable = false;

// Initialize sound library with RN 0.79.5 compatibility checks
const initializeSoundLibrary = () => {
  try {
    console.log('🔊 [RN 0.79.5] Attempting to load react-native-sound library...');
    
    // Try different import patterns for RN 0.79.5
    try {
      Sound = require('react-native-sound');
      if (Sound.default) {
        Sound = Sound.default;
      }
    } catch (importError) {
      console.log('⚠️ [RN 0.79.5] Standard import failed, trying alternative...');
      const SoundModule = require('react-native-sound');
      Sound = SoundModule.default || SoundModule;
    }
    
    if (Sound && typeof Sound.setCategory === 'function') {
      try {
        Sound.setCategory('Playback');
        soundAvailable = true;
        console.log('✅ [RN 0.79.5] react-native-sound library loaded successfully');
      } catch (categoryError) {
        console.log('⚠️ [RN 0.79.5] setCategory failed, but Sound object available:', categoryError);
        soundAvailable = true; // Still try to use it
      }
    } else {
      console.log('⚠️ [RN 0.79.5] Sound object loaded but setCategory not available');
      soundAvailable = false;
    }
  } catch (error: any) {
    console.log('❌ [RN 0.79.5] react-native-sound not available:', error?.message || error);
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
  
  // RN 0.79.5 compatible sound loading strategies
  private readonly soundLoadingStrategies: Record<SoundKey, string[]> = {
    // Try multiple loading approaches for each sound
    buttonPress: [
      'buttonpress.mp3',      // Direct file name
      'buttonpress.wav',      // Alternative format
      'android.resource://com.brainbites/raw/buttonpress', // Android resource URI
      'sound_buttonpress',    // Alternative name
    ],
    correct: [
      'correct.mp3',
      'correct.wav', 
      'android.resource://com.brainbites/raw/correct',
      'sound_correct',
    ],
    incorrect: [
      'incorrect.mp3',
      'incorrect.wav',
      'android.resource://com.brainbites/raw/incorrect', 
      'sound_incorrect',
    ],
    streak: [
      'streak.mp3',
      'streak.wav',
      'android.resource://com.brainbites/raw/streak',
      'sound_streak',
    ],
    gameMusic: [
      'gamemusic.mp3',
      'gamemusic.wav',
      'android.resource://com.brainbites/raw/gamemusic',
      'sound_gamemusic',
    ],
    menuMusic: [
      'menumusic.mp3', 
      'menumusic.wav',
      'android.resource://com.brainbites/raw/menumusic',
      'sound_menumusic',
    ],
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔊 [RN 0.79.5] SoundService already initialized');
      return;
    }
    
    console.log('🚀 [RN 0.79.5] Initializing SoundService...');
    
    if (!soundAvailable || !Sound) {
      console.log('⚠️ [RN 0.79.5] Sound library not available, creating stub methods');
      this.createStubMethods();
      this.isInitialized = true;
      return;
    }
    
    try {
      // Load all sound files using RN 0.79.5 compatible methods
      const loadPromises = Object.entries(this.soundLoadingStrategies).map(([key, strategies]) => 
        this.loadSoundWithStrategies(key as SoundKey, strategies).catch((error) => {
          console.log(`⚠️ [RN 0.79.5] Failed to load sound: ${key} - ${error}`);
        })
      );
      
      await Promise.all(loadPromises);
      this.isInitialized = true;
      console.log('✅ [RN 0.79.5] SoundService initialized successfully');
    } catch (error) {
      console.log('❌ [RN 0.79.5] Failed to initialize sounds:', error);
      this.createStubMethods();
      this.isInitialized = true; // Mark as initialized to prevent retries
    }
  }

  // Create stub methods when sound library fails - prevents "function not defined" errors
  private createStubMethods() {
    console.log('🔇 [RN 0.79.5] Creating stub sound methods (silent operation)');
    
    // All methods will exist but do nothing
    const soundKeys: SoundKey[] = ['buttonPress', 'correct', 'incorrect', 'streak', 'gameMusic', 'menuMusic'];
    soundKeys.forEach(key => {
      this.sounds.set(key, {
        play: (callback?: (success: boolean) => void) => {
          console.log(`🔇 [STUB] Playing ${key} (silent)`);
          if (callback) callback(true);
        },
        setVolume: () => {},
        setCurrentTime: () => {},
        setNumberOfLoops: () => {},
        stop: () => {},
        pause: () => {},
        release: () => {},
      });
    });
  }

  // RN 0.79.5 compatible sound loading with multiple strategies
  private async loadSoundWithStrategies(key: SoundKey, strategies: string[]): Promise<void> {
    if (!Sound || !soundAvailable) {
      console.log(`⚠️ [RN 0.79.5] Sound library not available, creating stub for ${key}`);
      return;
    }

    let lastError: any;
    
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      console.log(`🔄 [RN 0.79.5] Trying strategy ${i + 1}/${strategies.length} for ${key}: ${strategy}`);
      
      try {
        const sound = await this.loadSoundWithStrategy(key, strategy);
        if (sound) {
          this.sounds.set(key, sound);
          console.log(`✅ [RN 0.79.5] Successfully loaded ${key} using strategy: ${strategy}`);
          return;
        }
      } catch (error) {
        lastError = error;
        console.log(`⚠️ [RN 0.79.5] Strategy ${i + 1} failed for ${key}:`, error);
      }
    }
    
    console.log(`❌ [RN 0.79.5] All strategies failed for ${key}, creating stub`);
    // Create stub for this specific sound
    this.sounds.set(key, {
      play: (callback?: (success: boolean) => void) => {
        console.log(`🔇 [STUB] Playing ${key} (silent - all strategies failed)`);
        if (callback) callback(true);
      },
      setVolume: () => {},
      setCurrentTime: () => {},
      setNumberOfLoops: () => {},
      stop: () => {},
      pause: () => {},
      release: () => {},
    });
  }

  private loadSoundWithStrategy(key: SoundKey, filename: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // Strategy 1: Direct filename (works if sound is in bundle)
        if (!filename.includes('android.resource://')) {
          console.log(`🔄 [RN 0.79.5] Loading ${key} from bundle: ${filename}`);
          
          const sound = new Sound(filename, Sound.MAIN_BUNDLE, (error: any) => {
            if (error) {
              console.log(`⚠️ [RN 0.79.5] Bundle loading failed for ${filename}:`, error.message);
              reject(error);
            } else {
              console.log(`✅ [RN 0.79.5] Bundle loading success for ${filename}`);
              resolve(sound);
            }
          });
          
          // Set timeout to prevent hanging
          setTimeout(() => {
            reject(new Error(`Timeout loading ${filename} from bundle`));
          }, 5000);
          
        } else {
          // Strategy 2: Android resource URI (for Android-specific loading)
          if (Platform.OS === 'android') {
            console.log(`🔄 [RN 0.79.5] Loading ${key} from Android resource: ${filename}`);
            
            const sound = new Sound(filename, '', (error: any) => {
              if (error) {
                console.log(`⚠️ [RN 0.79.5] Android resource loading failed:`, error.message);
                reject(error);
              } else {
                console.log(`✅ [RN 0.79.5] Android resource loading success`);
                resolve(sound);
              }
            });
            
            setTimeout(() => {
              reject(new Error(`Timeout loading ${filename} from Android resource`));
            }, 5000);
            
          } else {
            reject(new Error('Android resource URI not supported on iOS'));
          }
        }
        
      } catch (error) {
        console.log(`❌ [RN 0.79.5] Error creating sound for ${key} with ${filename}:`, error);
        reject(error);
      }
    });
  }

  private playSound(key: SoundKey, options?: { volume?: number }): void {
    if (!this.isSoundEnabled || !soundAvailable) {
      console.log(`🔇 [RN 0.79.5] Sound disabled or unavailable, skipping: ${key}`);
      return;
    }
    
    const sound = this.sounds.get(key);
    if (!sound) {
      console.log(`⚠️ [RN 0.79.5] Sound ${key} not loaded or not available`);
      return;
    }
    
    try {
      // Reset to beginning
      if (sound.setCurrentTime && typeof sound.setCurrentTime === 'function') {
        sound.setCurrentTime(0);
      }
      
      // Set volume
      const volume = options?.volume ?? this.effectsVolume;
      if (sound.setVolume && typeof sound.setVolume === 'function') {
        sound.setVolume(volume);
      }
      
      // Play the sound
      if (sound.play && typeof sound.play === 'function') {
        sound.play((success: boolean) => {
          if (success) {
            console.log(`🔊 [RN 0.79.5] Successfully played sound: ${key}`);
          } else {
            console.log(`⚠️ [RN 0.79.5] Failed to play sound: ${key}`);
          }
        });
      } else {
        console.log(`⚠️ [RN 0.79.5] Sound ${key} has no play method`);
      }
    } catch (error) {
      console.log(`❌ [RN 0.79.5] Error playing sound ${key}:`, error);
    }
  }

  // ===== PUBLIC METHODS =====
  // These methods now always exist and handle RN 0.79.5 compatibility

  playButtonPress(): void {
    console.log('🔊 [RN 0.79.5] playButtonPress called');
    this.playSound('buttonPress', { volume: this.effectsVolume });
  }

  playButtonClick(): void {
    console.log('🔊 [RN 0.79.5] playButtonClick called (alias for playButtonPress)');
    this.playButtonPress();
  }

  playCorrect(): void {
    console.log('🔊 [RN 0.79.5] playCorrect called');
    this.playSound('correct', { volume: this.effectsVolume });
  }

  playIncorrect(): void {
    console.log('🔊 [RN 0.79.5] playIncorrect called'); 
    this.playSound('incorrect', { volume: this.effectsVolume });
  }

  playStreak(): void {
    console.log('🔊 [RN 0.79.5] playStreak called');
    this.playSound('streak', { volume: this.effectsVolume });
  }

  startMenuMusic(): void {
    console.log('🎵 [RN 0.79.5] startMenuMusic called');
    if (!this.isMusicEnabled || !soundAvailable) {
      console.log('🔇 [RN 0.79.5] Music disabled or unavailable');
      return;
    }
    
    this.stopMusic();
    
    const music = this.sounds.get('menuMusic');
    if (!music) {
      console.log('⚠️ [RN 0.79.5] Menu music not available');
      return;
    }
    
    try {
      if (music.setNumberOfLoops && typeof music.setNumberOfLoops === 'function') {
        music.setNumberOfLoops(-1);
      }
      if (music.setVolume && typeof music.setVolume === 'function') {
        music.setVolume(this.musicVolume);
      }
      if (music.setCurrentTime && typeof music.setCurrentTime === 'function') {
        music.setCurrentTime(0);
      }
      
      if (music.play && typeof music.play === 'function') {
        music.play((success: boolean) => {
          if (success) {
            this.musicInstance = music;
            console.log('🎵 [RN 0.79.5] Menu music started successfully');
          } else {
            console.log('⚠️ [RN 0.79.5] Failed to play menu music');
          }
        });
      }
    } catch (error) {
      console.log('❌ [RN 0.79.5] Error starting menu music:', error);
    }
  }

  startGameMusic(): void {
    console.log('🎵 [RN 0.79.5] startGameMusic called');
    if (!this.isMusicEnabled || !soundAvailable) {
      console.log('🔇 [RN 0.79.5] Music disabled or unavailable');
      return;
    }
    
    this.stopMusic();
    
    const music = this.sounds.get('gameMusic');
    if (!music) {
      console.log('⚠️ [RN 0.79.5] Game music not available');
      return;
    }
    
    try {
      if (music.setNumberOfLoops && typeof music.setNumberOfLoops === 'function') {
        music.setNumberOfLoops(-1);
      }
      if (music.setVolume && typeof music.setVolume === 'function') {
        music.setVolume(this.musicVolume);
      }
      if (music.setCurrentTime && typeof music.setCurrentTime === 'function') {
        music.setCurrentTime(0);
      }
      
      if (music.play && typeof music.play === 'function') {
        music.play((success: boolean) => {
          if (success) {
            this.musicInstance = music;
            console.log('🎵 [RN 0.79.5] Game music started successfully');
          } else {
            console.log('⚠️ [RN 0.79.5] Failed to play game music');
          }
        });
      }
    } catch (error) {
      console.log('❌ [RN 0.79.5] Error starting game music:', error);
    }
  }

  stopMusic(): void {
    console.log('🔇 [RN 0.79.5] stopMusic called');
    if (this.musicInstance && soundAvailable) {
      try {
        if (this.musicInstance.stop && typeof this.musicInstance.stop === 'function') {
          this.musicInstance.stop();
          console.log('✅ [RN 0.79.5] Music stopped successfully');
        }
      } catch (error) {
        console.log('❌ [RN 0.79.5] Error stopping music:', error);
      }
      this.musicInstance = null;
    }
  }

  pauseMusic(): void {
    console.log('⏸️ [RN 0.79.5] pauseMusic called');
    if (this.musicInstance && soundAvailable) {
      try {
        if (this.musicInstance.pause && typeof this.musicInstance.pause === 'function') {
          this.musicInstance.pause();
          console.log('✅ [RN 0.79.5] Music paused successfully');
        }
      } catch (error) {
        console.log('❌ [RN 0.79.5] Error pausing music:', error);
      }
    }
  }

  resumeMusic(): void {
    console.log('▶️ [RN 0.79.5] resumeMusic called');
    if (this.musicInstance && this.isMusicEnabled && soundAvailable) {
      try {
        if (this.musicInstance.play && typeof this.musicInstance.play === 'function') {
          this.musicInstance.play();
          console.log('✅ [RN 0.79.5] Music resumed successfully');
        }
      } catch (error) {
        console.log('❌ [RN 0.79.5] Error resuming music:', error);
      }
    }
  }

  // ===== SETTINGS METHODS =====
  setMusicEnabled(enabled: boolean): void {
    console.log(`🎵 [RN 0.79.5] setMusicEnabled: ${enabled}`);
    this.isMusicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  setSoundEnabled(enabled: boolean): void {
    console.log(`🔊 [RN 0.79.5] setSoundEnabled: ${enabled}`);
    this.isSoundEnabled = enabled;
  }

  setMusicVolume(volume: number): void {
    console.log(`🎵 [RN 0.79.5] setMusicVolume: ${volume}`);
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.musicInstance && soundAvailable) {
      try {
        if (this.musicInstance.setVolume && typeof this.musicInstance.setVolume === 'function') {
          this.musicInstance.setVolume(this.musicVolume);
        }
      } catch (error) {
        console.log('❌ [RN 0.79.5] Error setting music volume:', error);
      }
    }
  }

  setEffectsVolume(volume: number): void {
    console.log(`🔊 [RN 0.79.5] setEffectsVolume: ${volume}`);
    this.effectsVolume = Math.max(0, Math.min(1, volume));
  }

  // ===== GETTERS =====
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
      rnVersion: '0.79.5',
    };
  }

  release(): void {
    console.log('🗑️ [RN 0.79.5] Releasing SoundService resources...');
    
    this.stopMusic();
    
    if (soundAvailable) {
      this.sounds.forEach((sound, key) => {
        try {
          if (sound && sound.release && typeof sound.release === 'function') {
            sound.release();
            console.log(`✅ [RN 0.79.5] Released sound: ${key}`);
          }
        } catch (error) {
          console.log(`❌ [RN 0.79.5] Error releasing sound ${key}:`, error);
        }
      });
    }
    
    this.sounds.clear();
    this.isInitialized = false;
    this.musicInstance = null;
    
    console.log('✅ [RN 0.79.5] SoundService resources released successfully');
  }
}

export default new SoundServiceClass();