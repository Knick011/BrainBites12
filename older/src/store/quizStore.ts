import { create } from 'zustand';
import { Question } from '@types';

interface QuizStore {
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  score: number;
  timeLeft: number;
  isActive: boolean;
  questions: Question[];
  selectedAnswer: number | null;
  showResult: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  streak: number;
  
  // Actions
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestion: (question: Question, index: number) => void;
  selectAnswer: (answerIndex: number) => void;
  submitAnswer: () => boolean;
  nextQuestion: () => void;
  setTimeLeft: (time: number) => void;
  startQuiz: (difficulty: 'easy' | 'medium' | 'hard', category: string) => void;
  endQuiz: () => void;
  resetQuiz: () => void;
  addScore: (points: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
}

const getDifficultySettings = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy':
      return { timeLimit: 60, points: 10 };
    case 'medium':
      return { timeLimit: 120, points: 20 };
    case 'hard':
      return { timeLimit: 180, points: 30 };
    default:
      return { timeLimit: 60, points: 10 };
  }
};

export const useQuizStore = create<QuizStore>((set, get) => ({
  currentQuestion: null,
  currentQuestionIndex: 0,
  score: 0,
  timeLeft: 60,
  isActive: false,
  questions: [],
  selectedAnswer: null,
  showResult: false,
  difficulty: 'easy',
  category: 'General',
  streak: 0,
  
  setQuestions: (questions: Question[]) => {
    set({ questions });
  },
  
  setCurrentQuestion: (question: Question, index: number) => {
    set({
      currentQuestion: question,
      currentQuestionIndex: index,
      selectedAnswer: null,
      showResult: false,
    });
  },
  
  selectAnswer: (answerIndex: number) => {
    set({ selectedAnswer: answerIndex });
  },
  
  submitAnswer: () => {
    const { currentQuestion, selectedAnswer } = get();
    if (!currentQuestion || selectedAnswer === null) return false;
    
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    set({ showResult: true });
    
    if (isCorrect) {
      const { difficulty } = get();
      const { points } = getDifficultySettings(difficulty);
      get().addScore(points);
      get().incrementStreak();
    } else {
      get().resetStreak();
    }
    
    return isCorrect;
  },
  
  nextQuestion: () => {
    const { questions, currentQuestionIndex } = get();
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < questions.length) {
      get().setCurrentQuestion(questions[nextIndex], nextIndex);
    } else {
      get().endQuiz();
    }
  },
  
  setTimeLeft: (time: number) => {
    set({ timeLeft: Math.max(0, time) });
  },
  
  startQuiz: (difficulty: 'easy' | 'medium' | 'hard', category: string) => {
    const { timeLimit } = getDifficultySettings(difficulty);
    set({
      difficulty,
      category,
      timeLeft: timeLimit,
      isActive: true,
      score: 0,
      streak: 0,
      currentQuestionIndex: 0,
      selectedAnswer: null,
      showResult: false,
    });
  },
  
  endQuiz: () => {
    set({
      isActive: false,
      currentQuestion: null,
    });
  },
  
  resetQuiz: () => {
    set({
      currentQuestion: null,
      currentQuestionIndex: 0,
      score: 0,
      timeLeft: 60,
      isActive: false,
      questions: [],
      selectedAnswer: null,
      showResult: false,
      streak: 0,
    });
  },
  
  addScore: (points: number) => {
    set((state) => ({ score: state.score + points }));
  },
  
  incrementStreak: () => {
    set((state) => ({ streak: state.streak + 1 }));
  },
  
  resetStreak: () => {
    set({ streak: 0 });
  },
}));