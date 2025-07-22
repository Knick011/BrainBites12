import Sound from 'react-native-sound';
import { useAudioStore } from '../store/audioStore';

// Enable playback in silence mode
Sound.setCategory('Playback');

class AudioService {
  private sounds: { [key: string]: Sound } = {};
  private currentMusic: Sound | null = null;
  private isInitialized: boolean = false;
  
  constructor() {
    // Don't preload sounds in constructor - do it lazily
  }
  
  private initializeSounds() {
    if (this.isInitialized) return;
    
    try {
      const soundFiles = {
        menuMusic: 'menumusic.mp3',
        gameMusic: 'gamemusic.mp3',
        correctAnswer: 'correct.mp3',
        incorrectAnswer: 'incorrect.mp3',
        buttonClick: 'buttonpress.mp3',
        celebration: 'streak.mp3',
      };

      Object.entries(soundFiles).forEach(([key, filename]) => {
        try {
          this.sounds[key] = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
            if (error) {
              console.log(`Failed to load sound ${filename}:`, error);
            }
          });
        } catch (error) {
          console.log(`Error creating sound ${key}:`, error);
        }
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.log('Error initializing sounds:', error);
      // Don't set isInitialized to true if there was an error
    }
  }
  
  playSound(soundKey: string, loop: boolean = false) {
    try {
      this.initializeSounds(); // Lazy initialization
      
      const { isMuted, soundEffectsEnabled, volume } = useAudioStore.getState();
      
      if (isMuted || !soundEffectsEnabled) return;
      
      const sound = this.sounds[soundKey];
      if (sound) {
        sound.setVolume(volume);
        sound.setNumberOfLoops(loop ? -1 : 0);
        sound.play((success) => {
          if (!success) {
            console.log(`Playback failed for ${soundKey}`);
          }
        });
      } else {
        console.log(`Sound not found: ${soundKey}`);
      }
    } catch (error) {
      console.log(`Error playing sound ${soundKey}:`, error);
    }
  }
  
  playMusic(musicKey: string) {
    try {
      this.initializeSounds(); // Lazy initialization
      
      const { isMuted, volume } = useAudioStore.getState();
      
      if (isMuted) return;
      
      // Stop current music
      if (this.currentMusic) {
        this.currentMusic.stop();
      }
      
      const music = this.sounds[musicKey];
      if (music) {
        this.currentMusic = music;
        music.setVolume(volume * 0.6); // Background music should be quieter
        music.setNumberOfLoops(-1); // Loop indefinitely
        music.play((success) => {
          if (!success) {
            console.log(`Music playback failed for ${musicKey}`);
          }
        });
        
        useAudioStore.getState().setCurrentTrack(musicKey);
      } else {
        console.log(`Music not found: ${musicKey}`);
      }
    } catch (error) {
      console.log(`Error playing music ${musicKey}:`, error);
    }
  }
  
  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
      useAudioStore.getState().setCurrentTrack(null);
    }
  }
  
  pauseMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
    }
  }
  
  resumeMusic() {
    if (this.currentMusic) {
      this.currentMusic.play();
    }
  }
  
  setVolume(volume: number) {
    this.initializeSounds(); // Lazy initialization
    Object.values(this.sounds).forEach(sound => {
      sound.setVolume(volume);
    });
  }
  
  stopAllSounds() {
    Object.values(this.sounds).forEach(sound => {
      sound.stop();
    });
    this.currentMusic = null;
  }
  
  release() {
    Object.values(this.sounds).forEach(sound => {
      sound.release();
    });
    this.sounds = {};
    this.currentMusic = null;
    this.isInitialized = false;
  }
}

export const audioService = new AudioService();