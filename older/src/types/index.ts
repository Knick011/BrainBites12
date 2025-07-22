export interface Question {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    explanation?: string;
  }
  
  export interface User {
    name: string;
    totalScore: number;
    streak: number;
    gamesPlayed: number;
    correctAnswers: number;
    dailyGoal: number;
    dailyProgress: number;
  }
  
  export interface QuizState {
    currentQuestion: Question | null;
    currentQuestionIndex: number;
    score: number;
    timeLeft: number;
    isActive: boolean;
    questions: Question[];
    selectedAnswer: number | null;
    showResult: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
  }
  
  export interface MascotState {
    currentEmotion: 'happy' | 'excited' | 'thinking' | 'sad' | 'celebrating' | 'neutral';
    isVisible: boolean;
    message: string;
  }
  
  export interface AudioState {
    isMuted: boolean;
    currentTrack: string | null;
    volume: number;
  }