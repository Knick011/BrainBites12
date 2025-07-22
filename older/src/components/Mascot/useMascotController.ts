import { useCallback } from 'react';
import { useMascotStore } from '../../store/mascotStore';
import { useAudio } from '@services/useAudio';

export const useMascotController = () => {
  const { setEmotion, showMessage } = useMascotStore();
  const { playSound } = useAudio();
  
  const celebrateCorrectAnswer = useCallback(() => {
    showMessage('celebrating', '🎉 Excellent! You got it right!', 2000);
    playSound('correctAnswer');
  }, [showMessage, playSound]);
  
  const reactToWrongAnswer = useCallback(() => {
    showMessage('sad', "Don't worry! You'll get the next one! 💪", 2000);
    playSound('incorrectAnswer');
  }, [showMessage, playSound]);
  
  const showThinking = useCallback(() => {
    setEmotion('thinking');
  }, [setEmotion]);
  
  const showExcitement = useCallback(() => {
    showMessage('excited', "Let's dive into this quiz! 🚀", 2000);
  }, [showMessage]);
  
  const showEncouragement = useCallback((streak: number) => {
    if (streak >= 5) {
      showMessage('celebrating', `Amazing ${streak} streak! You're on fire! 🔥`, 3000);
    } else if (streak >= 3) {
      showMessage('happy', `Great job! ${streak} in a row! ⭐`, 2000);
    }
  }, [showMessage]);
  
  const showWelcome = useCallback(() => {
    showMessage('happy', "Welcome to BrainBites! Ready to learn? 🌟", 3000);
  }, [showMessage]);
  
  const showQuizComplete = useCallback((score: number) => {
    if (score >= 80) {
      showMessage('celebrating', `Outstanding! ${score} points! 🏆`, 4000);
    } else if (score >= 50) {
      showMessage('happy', `Well done! ${score} points! 👏`, 3000);
    } else {
      showMessage('neutral', `Good effort! ${score} points. Keep practicing! 📚`, 3000);
    }
  }, [showMessage]);
  
  return {
    celebrateCorrectAnswer,
    reactToWrongAnswer,
    showThinking,
    showExcitement,
    showEncouragement,
    showWelcome,
    showQuizComplete,
  };
};