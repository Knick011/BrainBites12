// src/screens/QuizScreen.tsx - BackHandler compatibility fix for RN 0.79.5
// ✅ FIXES: "BackHandler.removeEventListener is not a function" API change
// console.log: "This QuizScreen uses the new BackHandler subscription pattern for RN 0.79.5"

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform,
  BackHandler,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Question, ScoreResult } from '../types';
import QuestionService from '../services/QuestionService';
import EnhancedScoreService from '../services/EnhancedScoreService';
import SoundService from '../services/SoundService';
import { logEvent } from '../config/Firebase';
import { useBackHandler } from '../hooks/useBackHandler'; // NEW: RN 0.79.5 compatible
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BannerAdComponent from '../components/BannerAdComponent';
import EnhancedMascotDisplay from '../components/Mascot/EnhancedMascotDisplay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QUESTION_TIME_LIMIT = 30; // seconds

type QuizScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;
type QuizScreenRouteProp = RouteProp<RootStackParamList, 'Quiz'>;
type MascotType = 'happy' | 'sad' | 'excited' | 'depressed' | 'gamemode' | 'below';

interface QuizScreenState {
  currentQuestion: Question | null;
  selectedAnswer: string | null;
  showResult: boolean;
  isCorrect: boolean;
  streak: number;
  showStreakAnimation: boolean;
  showMascot: boolean;
  mascotMessage: string;
  isLoading: boolean;
  questionsAnswered: number;
  correctAnswers: number;
  showExplanation: boolean;
  score: number;
  isStreakMilestone: boolean;
  showPointsAnimation: boolean;
  pointsEarned: number;
  timeRemaining: number;
  isTimerActive: boolean;
  hasTimedOut: false;
}

const QuizScreen: React.FC = () => {
  const navigation = useNavigation<QuizScreenNavigationProp>();
  const route = useRoute<QuizScreenRouteProp>();
  const { difficulty, category } = route.params;
  
  // Timer references
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resultTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Quiz state
  const [quizState, setQuizState] = useState<QuizScreenState>({
    currentQuestion: null,
    selectedAnswer: null,
    showResult: false,
    isCorrect: false,
    streak: 0,
    showStreakAnimation: false,
    showMascot: true,
    mascotMessage: "Ready to test your knowledge?",
    isLoading: true,
    questionsAnswered: 0,
    correctAnswers: 0,
    showExplanation: false,
    score: 0,
    isStreakMilestone: false,
    showPointsAnimation: false,
    pointsEarned: 0,
    timeRemaining: QUESTION_TIME_LIMIT,
    isTimerActive: false,
    hasTimedOut: false
  });

  // ===== BACK HANDLER SETUP (RN 0.79.5 COMPATIBLE) =====
  
  const handleBackPress = useCallback(() => {
    console.log('🔙 Back button pressed in QuizScreen');
    handleQuitQuiz();
    return true; // Prevent default back behavior
  }, []);

  // NEW: Use the compatible back handler hook
  useBackHandler(handleBackPress, true);

  // Alternative approach for screens that need useFocusEffect
  // useFocusEffect(
  //   useCallback(() => {
  //     console.log('🔙 Setting up BackHandler for QuizScreen (RN 0.79.5 compatible)');
      
  //     // NEW API: addEventListener returns subscription object
  //     const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      
  //     return () => {
  //       console.log('🔙 Removing BackHandler from QuizScreen');
  //       if (subscription) {
  //         // Check if subscription has remove method (newer RN versions)
  //         if (typeof subscription.remove === 'function') {
  //           subscription.remove();
  //         }
  //         // Fallback for compatibility
  //         else if (typeof subscription === 'function') {
  //           subscription();
  //         }
  //       }
  //     };
  //   }, [handleBackPress])
  // );

  // ===== QUIZ LOGIC =====

  const handleQuitQuiz = useCallback(() => {
    console.log('🏃‍♂️ User attempting to quit quiz');
    
    Alert.alert(
      'Quit Quiz?',
      'Are you sure you want to quit? Your progress will not be saved.',
      [
        {
          text: 'Continue Quiz',
          style: 'cancel',
          onPress: () => {
            console.log('🎯 User chose to continue quiz');
            // Play sound if available
            try {
              if (SoundService && typeof SoundService.playButtonPress === 'function') {
                SoundService.playButtonPress();
              }
            } catch (error) {
              console.log('⚠️ Error playing button sound:', error);
            }
          }
        },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => {
            console.log('👋 User confirmed quit, navigating to home');
            
            // Log quit event
            try {
              logEvent('quiz_quit', {
                difficulty,
                category: category || 'random',
                questions_answered: quizState.questionsAnswered,
                final_score: quizState.score
              });
            } catch (error) {
              console.log('⚠️ Error logging quit event:', error);
            }
            
            // Stop music
            try {
              if (SoundService && typeof SoundService.stopMusic === 'function') {
                SoundService.stopMusic();
              }
            } catch (error) {
              console.log('⚠️ Error stopping music:', error);
            }
            
            navigation.navigate('Home');
          }
        }
      ]
    );
  }, [navigation, difficulty, category, quizState.questionsAnswered, quizState.score]);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up QuizScreen timers...');
    
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);

  // Initialize quiz
  useEffect(() => {
    console.log('🚀 QuizScreen initializing...');
    initializeQuiz();
    return cleanup;
  }, [cleanup]);

  const initializeQuiz = async () => {
    try {
      console.log('🎯 Initializing quiz services...');
      
      // Initialize services with error handling
      try {
        if (QuestionService && typeof QuestionService.initialize === 'function') {
          await QuestionService.initialize();
          console.log('✅ QuestionService initialized');
        }
      } catch (questionServiceError) {
        console.log('❌ QuestionService initialization failed:', questionServiceError);
      }
      
      // Play game start sound
      try {
        if (SoundService && typeof SoundService.playButtonClick === 'function') {
          SoundService.playButtonClick();
        } else if (SoundService && typeof SoundService.playButtonPress === 'function') {
          SoundService.playButtonPress();
        }
      } catch (soundError) {
        console.log('⚠️ Error playing start sound:', soundError);
      }
      
      // Load first question
      await loadNextQuestion();
      
      // Log quiz start
      try {
        await logEvent('quiz_started', {
          difficulty,
          category: category || 'random'
        });
      } catch (logError) {
        console.log('⚠️ Error logging quiz start:', logError);
      }
      
      console.log('✅ Quiz initialization completed');
      
    } catch (error) {
      console.log('❌ Failed to initialize quiz:', error);
      Alert.alert(
        'Error', 
        'Failed to load quiz. Please try again.',
        [
          { 
            text: 'Go Back', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    }
  };

  const loadNextQuestion = async () => {
    try {
      console.log('📝 Loading next question...');
      setQuizState(prev => ({ ...prev, isLoading: true }));
      
      // Debug: Check QuestionService status
      console.log('🔍 QuestionService debug info:');
      if (QuestionService) {
        try {
          const serviceStatus = QuestionService.getServiceStatus();
          console.log('📊 Service Status:', serviceStatus);
          QuestionService.debugService();
        } catch (debugError) {
          console.log('⚠️ Error getting service debug info:', debugError);
        }
      } else {
        console.log('❌ QuestionService is null/undefined');
      }
      
      // Get question from service
      let question: Question | null = null;
      try {
        if (QuestionService && typeof QuestionService.getRandomQuestion === 'function') {
          console.log('🎯 Requesting question with params:', { difficulty, category });
          question = await QuestionService.getRandomQuestion(difficulty, category);
          console.log('📋 Received question:', question ? 'SUCCESS' : 'NULL');
        } else {
          console.log('❌ QuestionService.getRandomQuestion not available');
        }
      } catch (questionError) {
        console.log('❌ Error getting question from service:', questionError);
      }
      
      if (!question) {
        console.log('⚠️ No question received, showing error');
        console.log('🔍 Attempting to get service total question count...');
        try {
          const totalQuestions = QuestionService?.getTotalQuestionCount() || 0;
          console.log('📊 Total questions in service:', totalQuestions);
        } catch (countError) {
          console.log('❌ Error getting question count:', countError);
        }
        Alert.alert('Error', 'Could not load question. Please try again.');
        return;
      }
      
      console.log('✅ Question loaded successfully:', {
        id: question.id,
        question: question.question.substring(0, 50) + '...',
        category: question.category,
        difficulty: question.difficulty
      });
      
      setQuizState(prev => ({
        ...prev,
        currentQuestion: question,
        selectedAnswer: null,
        showResult: false,
        isCorrect: false,
        showExplanation: false,
        isLoading: false,
        timeRemaining: QUESTION_TIME_LIMIT,
        isTimerActive: true,
        hasTimedOut: false
      }));
      
      // Start question timer
      startQuestionTimer();
      
    } catch (error) {
      console.log('❌ Error loading question:', error);
      setQuizState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const startQuestionTimer = () => {
    console.log('⏰ Starting question timer');
    
    // Clear existing timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    
    questionTimerRef.current = setInterval(() => {
      setQuizState(prev => {
        const newTimeRemaining = prev.timeRemaining - 1;
        
        if (newTimeRemaining <= 0) {
          console.log('⏰ Timer expired!');
          handleTimeOut();
          return {
            ...prev,
            timeRemaining: 0,
            isTimerActive: false,
            hasTimedOut: true
          };
        }
        
        return {
          ...prev,
          timeRemaining: newTimeRemaining
        };
      });
    }, 1000);
  };

  const handleTimeOut = () => {
    console.log('⏰ Question timed out');
    
    // Clear timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    
    // Play incorrect sound
    try {
      if (SoundService && typeof SoundService.playIncorrect === 'function') {
        SoundService.playIncorrect();
      }
    } catch (error) {
      console.log('⚠️ Error playing timeout sound:', error);
    }
    
    // Show result
    setQuizState(prev => ({
      ...prev,
      selectedAnswer: null,
      showResult: true,
      isCorrect: false,
      streak: 0, // Reset streak on timeout
      questionsAnswered: prev.questionsAnswered + 1
    }));
    
    // Auto-proceed to next question
    resultTimerRef.current = setTimeout(() => {
      loadNextQuestion();
    }, 2000);
  };

  const handleAnswerSelect = (selectedOption: string) => {
    if (quizState.selectedAnswer || !quizState.currentQuestion) {
      console.log('⚠️ Answer already selected or no question available');
      return;
    }
    
    console.log('🎯 Answer selected:', selectedOption);
    
    // Clear question timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    
    const isCorrect = selectedOption === quizState.currentQuestion.correct_answer;
    console.log('✅ Answer is', isCorrect ? 'correct' : 'incorrect');
    
    // Play sound
    try {
      if (isCorrect && SoundService && typeof SoundService.playCorrect === 'function') {
        SoundService.playCorrect();
      } else if (!isCorrect && SoundService && typeof SoundService.playIncorrect === 'function') {
        SoundService.playIncorrect();
      }
    } catch (soundError) {
      console.log('⚠️ Error playing answer sound:', soundError);
    }
    
    // Calculate new streak and score
    const newStreak = isCorrect ? quizState.streak + 1 : 0;
    const pointsEarned = isCorrect ? (10 + newStreak * 2) : 0;
    const newScore = quizState.score + pointsEarned;
    
    setQuizState(prev => ({
      ...prev,
      selectedAnswer: selectedOption,
      showResult: true,
      isCorrect,
      streak: newStreak,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      score: newScore,
      pointsEarned,
      showPointsAnimation: isCorrect,
      isTimerActive: false
    }));
    
    // Show explanation after delay
    setTimeout(() => {
      setQuizState(prev => ({ ...prev, showExplanation: true }));
    }, 1000);
    
    // Auto-proceed to next question
    resultTimerRef.current = setTimeout(() => {
      loadNextQuestion();
    }, 4000);
  };

  // ===== RENDER METHODS =====

  const renderQuestion = () => {
    if (!quizState.currentQuestion) return null;
    
    return (
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          {quizState.currentQuestion.question}
        </Text>
        
        <View style={styles.optionsContainer}>
          {['A', 'B', 'C', 'D'].map((option, index) => {
            const optionText = quizState.currentQuestion![`option_${option.toLowerCase()}`];
            const isSelected = quizState.selectedAnswer === option;
            const isCorrect = option === quizState.currentQuestion!.correct_answer;
            
            let buttonStyle = [styles.optionButton];
            let textStyle = [styles.optionText];
            
            if (quizState.showResult) {
              if (isCorrect) {
                buttonStyle.push(styles.correctOption);
                textStyle.push(styles.correctOptionText);
              } else if (isSelected && !isCorrect) {
                buttonStyle.push(styles.incorrectOption);
                textStyle.push(styles.incorrectOptionText);
              }
            } else if (isSelected) {
              buttonStyle.push(styles.selectedOption);
            }
            
            return (
              <TouchableOpacity
                key={option}
                style={buttonStyle}
                onPress={() => handleAnswerSelect(option)}
                disabled={quizState.showResult || quizState.isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.optionLabel}>{option}</Text>
                <Text style={textStyle}>{optionText}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {quizState.showExplanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>Explanation:</Text>
            <Text style={styles.explanationText}>
              {quizState.currentQuestion.explanation}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.quitButton} 
        onPress={handleQuitQuiz}
        activeOpacity={0.8}
      >
        <Icon name="close" size={24} color="#333" />
      </TouchableOpacity>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {quizState.score}</Text>
        <Text style={styles.streakText}>Streak: {quizState.streak}</Text>
      </View>
      
      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, quizState.timeRemaining <= 5 && styles.urgentTimer]}>
          {quizState.timeRemaining}s
        </Text>
      </View>
    </View>
  );

  if (quizState.isLoading && !quizState.currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading Quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFF8E7" barStyle="dark-content" />
      
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderQuestion()}
        
        {/* Mascot Display */}
        {quizState.showMascot && (
          <EnhancedMascotDisplay
            type={quizState.isCorrect ? 'happy' : 'sad'}
            message={quizState.mascotMessage}
            visible={quizState.showResult}
          />
        )}
        
        {/* Banner Ad */}
        <BannerAdComponent style={styles.adContainer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  quitButton: {
    padding: 8,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  streakText: {
    fontSize: 14,
    color: '#666',
  },
  timerContainer: {
    minWidth: 50,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  urgentTimer: {
    color: '#d32f2f',
  },
  questionContainer: {
    padding: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    lineHeight: 26,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedOption: {
    borderColor: '#FFD700',
    backgroundColor: '#FFFBEB',
  },
  correctOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  incorrectOption: {
    borderColor: '#f44336',
    backgroundColor: '#FFEBEE',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
    minWidth: 20,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  correctOptionText: {
    color: '#2E7D32',
  },
  incorrectOptionText: {
    color: '#C62828',
  },
  explanationContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  adContainer: {
    marginTop: 20,
  },
});

export default QuizScreen;