// src/screens/QuizScreen.tsx - Updated with Live State Management Integration
// ✅ FIXED: Live state management integrated while preserving existing design
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import QuestionService from '../services/QuestionService';
import SoundService from '../services/SoundService';
import EnhancedScoreService from '../services/EnhancedScoreService';
import EnhancedMascotDisplay from '../components/Mascot/EnhancedMascotDisplay';

// ✅ LIVE STATE INTEGRATION
import { useQuizIntegration } from '../hooks/useGameIntegration';
import { useLiveScore } from '../store/useLiveGameStore';

const QuizScreen = ({ navigation, route }: any) => {
  // ✅ LIVE STATE INTEGRATION - Enhanced answer processing
  const { handleQuizCompletion, scoreData, isInitialized } = useQuizIntegration();
  const { 
    dailyScore, 
    currentStreak, 
    animatingScore, 
    animatingStreak 
  } = useLiveScore();

  // Existing state
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [category, setCategory] = useState(route.params?.category);
  const [difficulty, setDifficulty] = useState(route.params?.difficulty);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [streakLevel, setStreakLevel] = useState(0);
  const [isStreakMilestone, setIsStreakMilestone] = useState(false);
  const [speedCategory, setSpeedCategory] = useState('');
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [showSpeedFeedback, setShowSpeedFeedback] = useState(false);

  // Mascot state
  const [showMascot, setShowMascot] = useState(false);
  const [mascotType, setMascotType] = useState<'happy' | 'sad' | 'excited'>('happy');
  const [mascotMessage, setMascotMessage] = useState('');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const optionAnims = useRef<Animated.Value[]>([]).current;
  const pointsAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;
  const speedAnim = useRef(new Animated.Value(0)).current;

  // Timer for response time
  const questionStartTime = useRef<number>(0);

  useEffect(() => {
    if (isInitialized) {
      loadNextQuestion();
    }
  }, [isInitialized]);

  const loadNextQuestion = async () => {
    try {
      setIsLoading(true);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setShowExplanation(false);
      setShowPointsAnimation(false);
      setShowSpeedFeedback(false);

      const question = await QuestionService.getRandomQuestion(category, difficulty);
      
      if (!question) {
        console.error('No question received');
        return;
      }

      setCurrentQuestion(question);
      questionStartTime.current = Date.now();

      // Initialize option animations
      const numOptions = Object.keys(question.options).length;
      while (optionAnims.length < numOptions) {
        optionAnims.push(new Animated.Value(0));
      }

      // Animate question entrance
      fadeAnim.setValue(0);
      slideAnim.setValue(100);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate options
      optionAnims.slice(0, numOptions).forEach((anim, index) => {
        anim.setValue(0);
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: 200 + index * 100,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2)),
        }).start();
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load question:', error);
      setIsLoading(false);
    }
  };

  // ✅ ENHANCED ANSWER HANDLER - Uses live state management
  const handleAnswerSelect = async (selectedOption: string) => {
    if (selectedAnswer) return; // Already answered

    const responseTime = Date.now() - questionStartTime.current;
    setSelectedAnswer(selectedOption);

    const correct = selectedOption === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    // Update local counters
    setQuestionsAnswered(prev => prev + 1);
    if (correct) {
      setCorrectAnswers(prev => prev + 1);
    }

    try {
      // ✅ USE LIVE STATE MANAGEMENT
      const result = await handleQuizCompletion({
        isCorrect: correct,
        pointsEarned: 0, // Will be calculated by the system
        responseTime,
        category,
        difficulty: difficulty || 'medium'
      });

      console.log('Quiz completion result:', result);

      // Update UI state from result
      setPointsEarned(result.pointsEarned);
      setStreakLevel(result.streakLevel || 0);
      setIsStreakMilestone(result.isMilestone || false);
      setSpeedCategory(result.speedCategory || 'Good!');
      setSpeedMultiplier(result.speedMultiplier || 1.0);

      // Show animations based on result
      if (correct && result.pointsEarned > 0) {
        setShowPointsAnimation(true);
        
        // Points animation
        pointsAnim.setValue(0);
        Animated.sequence([
          Animated.timing(pointsAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pointsAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          })
        ]).start(() => {
          setShowPointsAnimation(false);
        });
      }

      // Show speed feedback
      if (result.speedCategory && result.speedCategory !== 'Good!') {
        setShowSpeedFeedback(true);
        speedAnim.setValue(0);
        Animated.sequence([
          Animated.timing(speedAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(speedAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          setShowSpeedFeedback(false);
        });
      }

      // Show streak milestone animation
      if (correct && result.isMilestone) {
        streakAnim.setValue(0);
        Animated.spring(streakAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 4,
          tension: 40,
        }).start(() => {
          setTimeout(() => {
            streakAnim.setValue(0);
          }, 2000);
        });
      }

      // Show mascot reaction
      if (correct) {
        setMascotType(result.isMilestone ? 'excited' : 'happy');
        setMascotMessage(
          result.isMilestone 
            ? `🎉 ${currentStreak} streak! Amazing!`
            : result.speedCategory === 'Lightning Fast!' 
            ? '⚡ Lightning fast!'
            : 'Great job! 🎯'
        );
      } else {
        setMascotType('sad');
        setMascotMessage('Don\'t worry, keep trying! 💪');
      }
      
      setShowMascot(true);

    } catch (error) {
      console.error('Failed to process answer:', error);
      
      // Fallback to basic feedback
      if (correct) {
        SoundService.playStreak();
        setMascotType('happy');
        setMascotMessage('Correct! Well done! 🎯');
      } else {
        SoundService.playStreak();
        setMascotType('sad');
        setMascotMessage('Not quite right, but keep going! 💪');
      }
      setShowMascot(true);
    }

    // Show explanation after delay
    setTimeout(() => {
      setShowExplanation(true);
    }, 1500);
  };

  const handleNextQuestion = () => {
    setShowMascot(false);
    loadNextQuestion();
  };

  const handleQuitQuiz = () => {
    SoundService.playStreak();
    navigation.goBack();
  };

  if (!isInitialized || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {!isInitialized ? 'Initializing...' : 'Loading question...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color="#999" />
          <Text style={styles.errorText}>Failed to load question</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNextQuestion}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

      {/* Header with live score */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleQuitQuiz} style={styles.backButton}>
          <Icon name="close" size={24} color="white" />
        </TouchableOpacity>

        {/* ✅ LIVE SCORE DISPLAY */}
        <View style={styles.scoreContainer}>
          <Animated.Text 
            style={[
              styles.scoreText,
              animatingScore && styles.animatingScore
            ]}
          >
            {dailyScore.toLocaleString()}
          </Animated.Text>
          <View style={styles.streakContainer}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Animated.Text 
              style={[
                styles.streakText,
                animatingStreak && styles.animatingStreak
              ]}
            >
              {currentStreak}
            </Animated.Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.questionCounter}>
            {questionsAnswered + 1}
          </Text>
        </View>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {correctAnswers}/{questionsAnswered} correct
        </Text>
        {difficulty && (
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(difficulty) }]}>
            <Text style={styles.difficultyText}>{difficulty.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <Animated.View 
          style={[
            styles.questionContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </Animated.View>

        {/* Answer options */}
        <View style={styles.optionsContainer}>
          {Object.entries(currentQuestion.options).map(([key, value], index) => (
            <Animated.View
              key={key}
              style={[
                styles.optionContainer,
                {
                  opacity: optionAnims[index] || 1,
                  transform: [{
                    translateY: (optionAnims[index] || new Animated.Value(1)).interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedAnswer === key && styles.selectedOption,
                  isCorrect !== null && key === currentQuestion.correctAnswer && styles.correctOption,
                  isCorrect !== null && selectedAnswer === key && key !== currentQuestion.correctAnswer && styles.incorrectOption
                ]}
                onPress={() => handleAnswerSelect(key)}
                disabled={selectedAnswer !== null}
                activeOpacity={0.8}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionLetter,
                    selectedAnswer === key && styles.selectedOptionLetter,
                    isCorrect !== null && key === currentQuestion.correctAnswer && styles.correctOptionLetter
                  ]}>
                    <Text style={[
                      styles.optionLetterText,
                      selectedAnswer === key && styles.selectedOptionLetterText,
                      isCorrect !== null && key === currentQuestion.correctAnswer && styles.correctOptionLetterText
                    ]}>
                      {key.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.optionText,
                    selectedAnswer === key && styles.selectedOptionText,
                    isCorrect !== null && key === currentQuestion.correctAnswer && styles.correctOptionText
                  ]}>
                    {value}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Explanation */}
        {showExplanation && currentQuestion.explanation && (
          <Animated.View style={[styles.explanationContainer, { opacity: fadeAnim }]}>
            <View style={styles.explanationHeader}>
              <Icon name="information" size={24} color="#4CAF50" />
              <Text style={styles.explanationTitle}>Explanation</Text>
            </View>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
            
            <TouchableOpacity style={styles.nextButton} onPress={handleNextQuestion}>
              <Text style={styles.nextButtonText}>Next Question</Text>
              <Icon name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Points animation overlay */}
      {showPointsAnimation && (
        <Animated.View style={[
          styles.pointsOverlay,
          {
            opacity: pointsAnim,
            transform: [
              {
                translateY: pointsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -50]
                })
              },
              {
                scale: pointsAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.2, 1]
                })
              }
            ]
          }
        ]}>
          <Text style={styles.pointsText}>+{pointsEarned}</Text>
          {speedMultiplier > 1 && (
            <Text style={styles.multiplierText}>{speedMultiplier}x Speed Bonus!</Text>
          )}
        </Animated.View>
      )}

      {/* Speed feedback overlay */}
      {showSpeedFeedback && (
        <Animated.View style={[
          styles.speedOverlay,
          {
            opacity: speedAnim,
            transform: [{ scale: speedAnim }]
          }
        ]}>
          <Text style={styles.speedText}>{speedCategory}</Text>
        </Animated.View>
      )}

      {/* Streak milestone overlay */}
      {isStreakMilestone && (
        <Animated.View style={[
          styles.streakOverlay,
          {
            opacity: streakAnim,
            transform: [{ scale: streakAnim }]
          }
        ]}>
          <Text style={styles.streakMilestoneText}>🔥 {currentStreak} STREAK! 🔥</Text>
        </Animated.View>
      )}

      {/* Enhanced Mascot */}
      <EnhancedMascotDisplay
        type={mascotType}
        position="right"
        showMascot={showMascot}
        message={mascotMessage}
        onDismiss={() => setShowMascot(false)}
        autoHide={true}
        autoHideDuration={3000}
      />
    </SafeAreaView>
  );
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return '#4CAF50';
    case 'medium': return '#FF9F1C';
    case 'hard': return '#F44336';
    default: return '#999';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#4CAF50',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    flex: 1,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  animatingScore: {
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  streakIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  animatingStreak: {
    textShadowColor: 'rgba(255, 159, 28, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerRight: {
    alignItems: 'center',
  },
  questionCounter: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  scrollView: {
    flex: 1,
  },
  questionContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  optionContainer: {
    marginBottom: 12,
  },
  optionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  selectedOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8f9fa',
  },
  correctOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  incorrectOption: {
    borderColor: '#f44336',
    backgroundColor: '#ffeaea',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedOptionLetter: {
    backgroundColor: '#4CAF50',
  },
  correctOptionLetter: {
    backgroundColor: '#4CAF50',
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  selectedOptionLetterText: {
    color: 'white',
  },
  correctOptionLetterText: {
    color: 'white',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  selectedOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  correctOptionText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  explanationContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  
  // Animation overlays
  pointsOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  pointsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
  },
  multiplierText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9F1C',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  speedOverlay: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  speedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9F1C',
    backgroundColor: 'rgba(255, 159, 28, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif-medium',
  },
  streakOverlay: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  streakMilestoneText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(255, 159, 28, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    overflow: 'hidden',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Black' : 'sans-serif-black',
  },
});

export default QuizScreen;