import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { QuestionCard } from '@components/Quiz/QuestionCard';
import { AnswerOptions } from '@components/Quiz/AnswerOptions';
import { QuizTimer } from '@components/Quiz/QuizTimer';
import { QuizProgress } from '@components/Quiz/QuizProgress';
import { MascotDisplay } from '@components/Mascot/MascotDisplay';
import { useMascotController } from '@components/Mascot/useMascotController';
import { useQuizStore } from '../store/quizStore';
import { useUserStore } from '../store/userStore';
import { useAudio } from '@services/useAudio';
import { getRandomQuestions, Question } from '../assets/data/questionsData';
import { theme } from '@styles/theme';

interface QuizScreenProps {
  navigation: any;
  route: {
    params: {
      difficulty: 'easy' | 'medium' | 'hard';
    };
  };
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ navigation, route }) => {
  const { difficulty } = route.params;
  const {
    currentQuestion,
    currentQuestionIndex,
    score,
    timeLeft,
    isActive,
    questions,
    selectedAnswer,
    showResult,
    streak,
    setQuestions,
    setCurrentQuestion,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    setTimeLeft,
    startQuiz,
    endQuiz,
    resetQuiz,
  } = useQuizStore();
  
  const {
    user,
    updateScore,
    incrementStreak,
    resetStreak,
    updateDailyProgress,
    incrementGamesPlayed,
    incrementCorrectAnswers,
    incrementTotalQuestions,
  } = useUserStore();
  
  const {
    celebrateCorrectAnswer,
    reactToWrongAnswer,
    showThinking,
    showExcitement,
    showEncouragement,
  } = useMascotController();
  
  const { playMusic, playSound } = useAudio();
  const timerRef = useRef<number | undefined>(undefined);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  const getDifficultySettings = () => {
    switch (difficulty) {
      case 'easy':
        return { timeLimit: 60, questionCount: 5 };
      case 'medium':
        return { timeLimit: 120, questionCount: 8 };
      case 'hard':
        return { timeLimit: 180, questionCount: 10 };
    }
  };
  
  useEffect(() => {
    // Initialize quiz
    const { questionCount } = getDifficultySettings();
    const quizQuestions = getRandomQuestions(questionCount, difficulty);
    
    setQuestions(quizQuestions);
    startQuiz(difficulty, 'Mixed');
    setCurrentQuestion(quizQuestions[0], 0);
    
    // Play game music
    playMusic('gameMusic');
    
    // Show excitement
    showExcitement();
    
    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, isActive]);
  
  const handleBackPress = () => {
    Alert.alert(
      'Exit Quiz',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
    return true;
  };
  
  const handleSelectAnswer = (answerIndex: number) => {
    if (showResult) return;
    
    selectAnswer(answerIndex);
    showThinking();
  };
  
  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || showResult) return;
    
    const isCorrect = submitAnswer();
    incrementTotalQuestions();
    
    if (isCorrect) {
      celebrateCorrectAnswer();
      incrementCorrectAnswers();
      incrementStreak();
      
      // Show encouragement for streaks
      if (streak + 1 >= 3) {
        setTimeout(() => {
          showEncouragement(streak + 1);
        }, 2000);
      }
    } else {
      reactToWrongAnswer();
      resetStreak();
    }
    
    // Auto-advance after 3 seconds
    setTimeout(() => {
      handleNextQuestion();
    }, 3000);
  };
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      nextQuestion();
    } else {
      completeQuiz();
    }
  };
  
  const completeQuiz = () => {
    setQuizCompleted(true);
    endQuiz();
    incrementGamesPlayed();
    updateDailyProgress();
    updateScore(score);
    
    // Navigate to results
    setTimeout(() => {
      navigation.replace('Results', { 
        score, 
        totalQuestions: questions.length,
        correctAnswers: questions.filter((_, index) => index < currentQuestionIndex + 1).length,
        difficulty 
      });
    }, 1000);
  };
  
  const handleTimeUp = () => {
    if (!showResult) {
      // Auto-submit current answer or treat as incorrect
      if (selectedAnswer !== null) {
        handleSubmitAnswer();
      } else {
        reactToWrongAnswer();
        resetStreak();
        setTimeout(() => {
          handleNextQuestion();
        }, 2000);
      }
    }
  };
  
  if (!currentQuestion || quizCompleted) {
    return (
      <LinearGradient colors={theme.colors.quiz} style={styles.container}>
        <View style={styles.loadingContainer}>
          <MascotDisplay size="large" showMessage />
          <Text style={styles.loadingText}>Finishing up...</Text>
        </View>
      </LinearGradient>
    );
  }
  
  return (
    <LinearGradient colors={theme.colors.quiz} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.textDark} />
          </TouchableOpacity>
          
          <Text style={styles.difficultyText}>{difficulty.toUpperCase()}</Text>
          
          <TouchableOpacity onPress={() => {}} style={styles.settingsButton}>
            <Icon name="settings" size={24} color={theme.colors.textDark} />
          </TouchableOpacity>
        </View>
        
        <QuizProgress
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          score={score}
          streak={streak}
        />
        
        <View style={styles.timerContainer}>
          <QuizTimer
            timeLeft={timeLeft}
            totalTime={getDifficultySettings().timeLimit}
            onTimeUp={handleTimeUp}
            isActive={isActive}
          />
        </View>
        
        <View style={styles.questionContainer}>
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />
        </View>
        
        <View style={styles.answersContainer}>
          <AnswerOptions
            options={currentQuestion.options}
            selectedAnswer={selectedAnswer}
            correctAnswer={showResult ? currentQuestion.correctAnswer : undefined}
            showResult={showResult}
            onSelectAnswer={handleSelectAnswer}
            disabled={showResult}
          />
        </View>
        
        <View style={styles.actionContainer}>
          {!showResult ? (
            <TouchableOpacity
              onPress={handleSubmitAnswer}
              style={[
                styles.submitButton,
                selectedAnswer === null && styles.submitButtonDisabled
              ]}
              disabled={selectedAnswer === null}
            >
              <LinearGradient
                colors={selectedAnswer !== null ? ['#4CAF50', '#45A049'] : ['#CCCCCC', '#BBBBBB']}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>Submit Answer</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.resultContainer}>
              <Text style={styles.explanationText}>
                {currentQuestion.explanation}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.mascotContainer}>
          <MascotDisplay size="small" showMessage={false} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    color: theme.colors.textDark,
    letterSpacing: 1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  answersContainer: {
    flex: 2,
    paddingVertical: theme.spacing.md,
  },
  actionContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  submitButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.white,
  },
  resultContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  explanationText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textDark,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  mascotContainer: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textDark,
    fontWeight: '600',
    marginTop: theme.spacing.lg,
  },
});