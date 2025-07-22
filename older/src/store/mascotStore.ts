import { create } from 'zustand';

type MascotEmotion = 'happy' | 'excited' | 'thinking' | 'sad' | 'celebrating' | 'neutral';

interface MascotStore {
  currentEmotion: MascotEmotion;
  isVisible: boolean;
  message: string;
  isAnimating: boolean;
  
  // Actions
  setEmotion: (emotion: MascotEmotion) => void;
  setMessage: (message: string) => void;
  setVisible: (visible: boolean) => void;
  setAnimating: (animating: boolean) => void;
  showMessage: (emotion: MascotEmotion, message: string, duration?: number) => void;
  reset: () => void;
}

const defaultMessages = {
  happy: "Let's learn something new! 🌟",
  excited: "Wow! Ready for a challenge? 🚀",
  thinking: "Hmm, take your time to think... 🤔",
  sad: "Don't worry, you'll get the next one! 💪",
  celebrating: "Amazing! You're doing great! 🎉",
  neutral: "Hi there! I'm here to help! 👋",
};

export const useMascotStore = create<MascotStore>((set, get) => ({
  currentEmotion: 'happy',
  isVisible: true,
  message: defaultMessages.happy,
  isAnimating: false,
  
  setEmotion: (emotion: MascotEmotion) => {
    set({
      currentEmotion: emotion,
      message: defaultMessages[emotion],
    });
  },
  
  setMessage: (message: string) => {
    set({ message });
  },
  
  setVisible: (visible: boolean) => {
    set({ isVisible: visible });
  },
  
  setAnimating: (animating: boolean) => {
    set({ isAnimating: animating });
  },
  
  showMessage: (emotion: MascotEmotion, message: string, duration = 3000) => {
    set({
      currentEmotion: emotion,
      message,
      isVisible: true,
      isAnimating: true,
    });
    
    setTimeout(() => {
      set({ isAnimating: false });
    }, duration);
  },
  
  reset: () => {
    set({
      currentEmotion: 'happy',
      isVisible: true,
      message: defaultMessages.happy,
      isAnimating: false,
    });
  },
}));