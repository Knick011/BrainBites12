// src/services/QuestionService.ts
// ✅ FIXES: "Error: No questions available" timing issue
// ✅ FIXES: Service initialization vs. question availability problems in RN 0.79.5
// console.log: "QuestionService with proper timing, availability checks, and RN 0.79.5 compatibility"

interface Question {
  id: number;
  category: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

class QuestionServiceClass {
  private questions: Question[] = [];
  private isInitialized: boolean = false;
  private isLoading: boolean = false;
  private lastUsedQuestions: number[] = [];
  private maxRecentQuestions: number = 50; // Avoid repeating last 50 questions

  constructor() {
    console.log('🚀 [RN 0.79.5] QuestionService constructor called');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ [RN 0.79.5] QuestionService already initialized with', this.questions.length, 'questions');
      return;
    }

    if (this.isLoading) {
      console.log('⏳ [RN 0.79.5] QuestionService initialization already in progress, waiting...');
      
      // Wait for existing initialization to complete
      let attempts = 0;
      const maxAttempts = 30; // 3 seconds max wait
      
      while (this.isLoading && attempts < maxAttempts) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
        attempts++;
      }
      
      if (this.isInitialized) {
        console.log('✅ [RN 0.79.5] QuestionService initialization completed during wait');
        return;
      } else {
        console.log('⚠️ [RN 0.79.5] QuestionService initialization timed out during wait');
      }
    }

    this.isLoading = true;
    console.log('🚀 [RN 0.79.5] Starting QuestionService initialization...');

    try {
      await this.loadQuestions();
      
      if (this.questions.length === 0) {
        throw new Error('No questions were loaded from data source');
      }
      
      this.isInitialized = true;
      console.log('✅ [RN 0.79.5] QuestionService initialized successfully with', this.questions.length, 'questions');
      
      // Test availability immediately after initialization
      this.testQuestionAvailability();
      
    } catch (error: any) {
      console.log('❌ [RN 0.79.5] QuestionService initialization failed:', error?.message || error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private async loadQuestions(): Promise<void> {
    try {
      console.log('📚 [RN 0.79.5] Loading questions from parsed data...');
      
      // Import questions data - now using the parsed questions directly
      let questionsData: any;
      
      try {
        // Import the parsed questions array (use service-compatible format)
        const questionsModule = require('../assets/data/questionsData');
        questionsData = questionsModule.serviceCompatibleQuestions || questionsModule.default || questionsModule.questions || questionsModule;
        console.log('✅ [RN 0.79.5] Successfully imported questions module');
      } catch (importError) {
        console.log('❌ [RN 0.79.5] Failed to import questionsData:', importError);
        throw new Error('Could not import questions data file');
      }

      if (!questionsData) {
        throw new Error('Questions data is null or undefined');
      }

      // The data should now be a pre-parsed array of question objects
      let rawQuestions: any[] = [];
      
      if (Array.isArray(questionsData)) {
        rawQuestions = questionsData;
        console.log('✅ [RN 0.79.5] Using direct questions array');
      } else if (questionsData.questions && Array.isArray(questionsData.questions)) {
        rawQuestions = questionsData.questions;
        console.log('✅ [RN 0.79.5] Using questions property');
      } else if (typeof questionsData === 'string') {
        // Fallback to CSV parsing if still needed
        console.log('⚠️ [RN 0.79.5] Falling back to CSV parsing');
        rawQuestions = this.parseCSVData(questionsData);
      } else {
        console.log('❌ [RN 0.79.5] Unknown questions data format:', typeof questionsData);
        throw new Error('Unknown questions data format');
      }

      console.log('📊 [RN 0.79.5] Found', rawQuestions.length, 'raw question entries');

      if (rawQuestions.length === 0) {
        throw new Error('No questions found in data source');
      }

      // Since questions are pre-parsed with correct field names, minimal processing needed
      this.questions = this.processQuestions(rawQuestions);
      
      if (this.questions.length === 0) {
        throw new Error('No valid questions after validation');
      }

      console.log('✅ [RN 0.79.5] Successfully loaded', this.questions.length, 'questions');
      
      // Log sample of question categories for verification
      const categories = [...new Set(this.questions.map(q => q.category))];
      console.log('📋 [RN 0.79.5] Available categories:', categories);
      
    } catch (error: any) {
      console.log('❌ [RN 0.79.5] Error loading questions:', error?.message || error);
      throw error;
    }
  }

  private parseCSVData(csvString: string): any[] {
    try {
      console.log('📄 [RN 0.79.5] Parsing CSV string data...');
      
      const lines = csvString.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const questions: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length === headers.length) {
          const question: any = {};
          headers.forEach((header, index) => {
            question[header] = values[index]?.trim() || '';
          });
          questions.push(question);
        }
      }
      
      console.log('✅ [RN 0.79.5] Parsed', questions.length, 'questions from CSV');
      return questions;
      
    } catch (error) {
      console.log('❌ [RN 0.79.5] Error parsing CSV:', error);
      return [];
    }
  }

  private processQuestions(rawQuestions: any[]): Question[] {
    console.log('🔄 [RN 0.79.5] Processing raw questions...');
    
    const processedQuestions: Question[] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < rawQuestions.length; i++) {
      const raw = rawQuestions[i];
      
      try {
        // Validate required fields
        if (!raw.question || !raw.option_a || !raw.option_b || !raw.option_c || !raw.option_d) {
          invalidCount++;
          continue;
        }

        if (!raw.correct_answer || !['A', 'B', 'C', 'D'].includes(raw.correct_answer)) {
          invalidCount++;
          continue;
        }

        // Create processed question object
        const question: Question = {
          id: raw.id || i + 1,
          category: raw.category || 'General',
          question: String(raw.question).trim(),
          option_a: String(raw.option_a).trim(),
          option_b: String(raw.option_b).trim(),
          option_c: String(raw.option_c).trim(),
          option_d: String(raw.option_d).trim(),
          correct_answer: String(raw.correct_answer).trim().toUpperCase(),
          explanation: String(raw.explanation || '').trim(),
          difficulty: this.validateDifficulty(raw.difficulty) || 'Medium',
        };

        processedQuestions.push(question);
        validCount++;
        
      } catch (processingError) {
        console.log('⚠️ [RN 0.79.5] Error processing question at index', i, ':', processingError);
        invalidCount++;
      }
    }

    console.log('📊 [RN 0.79.5] Question processing complete:');
    console.log('  ✅ Valid questions:', validCount);
    console.log('  ❌ Invalid questions:', invalidCount);
    console.log('  📋 Total processed:', processedQuestions.length);

    return processedQuestions;
  }

  private validateDifficulty(difficulty: any): 'Easy' | 'Medium' | 'Hard' | null {
    if (typeof difficulty !== 'string') return null;
    
    const normalized = difficulty.trim().toLowerCase();
    if (normalized === 'easy') return 'Easy';
    if (normalized === 'medium') return 'Medium';
    if (normalized === 'hard') return 'Hard';
    
    return null;
  }

  private testQuestionAvailability(): void {
    console.log('🧪 [RN 0.79.5] Testing question availability...');
    
    try {
      const testQuestion = this.getRandomQuestionSync();
      if (testQuestion) {
        console.log('✅ [RN 0.79.5] Question availability test passed');
      } else {
        console.log('❌ [RN 0.79.5] Question availability test failed - no question returned');
      }
    } catch (error) {
      console.log('❌ [RN 0.79.5] Question availability test failed with error:', error);
    }
  }

  // Convert internal format to QuizScreen format
  private convertToQuizScreenFormat(internalQuestion: Question): any {
    return {
      id: internalQuestion.id.toString(),
      category: internalQuestion.category,
      question: internalQuestion.question,
      correctAnswer: internalQuestion.correct_answer,
      options: {
        A: internalQuestion.option_a,
        B: internalQuestion.option_b,
        C: internalQuestion.option_c,
        D: internalQuestion.option_d
      },
      difficulty: internalQuestion.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
      explanation: internalQuestion.explanation,
      // Keep legacy fields
      optionA: internalQuestion.option_a,
      optionB: internalQuestion.option_b,
      optionC: internalQuestion.option_c,
      optionD: internalQuestion.option_d,
      level: internalQuestion.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'
    };
  }

  // ===== PUBLIC METHODS =====

  async getRandomQuestion(
    difficulty?: 'easy' | 'medium' | 'hard', 
    category?: string
  ): Promise<any> {
    console.log('🎲 [RN 0.79.5] getRandomQuestion called:', { difficulty, category });
    
    // Ensure service is initialized
    if (!this.isInitialized) {
      console.log('⚠️ [RN 0.79.5] Service not initialized, attempting initialization...');
      
      try {
        await this.initialize();
      } catch (initError) {
        console.log('❌ [RN 0.79.5] Failed to initialize service:', initError);
        return null;
      }
    }

    // Double-check questions availability
    if (this.questions.length === 0) {
      console.log('❌ [RN 0.79.5] No questions available after initialization');
      return null;
    }

    try {
      // Convert difficulty to internal format
      const internalDifficulty = difficulty ? 
        (difficulty.charAt(0).toUpperCase() + difficulty.slice(1)) as 'Easy' | 'Medium' | 'Hard' : 
        undefined;
      
      const internalQuestion = this.getRandomQuestionSync(internalDifficulty, category);
      if (!internalQuestion) {
        return null;
      }
      
      // Convert to QuizScreen format before returning
      return this.convertToQuizScreenFormat(internalQuestion);
    } catch (error) {
      console.log('❌ [RN 0.79.5] Error in getRandomQuestion:', error);
      return null;
    }
  }

  private getRandomQuestionSync(
    difficulty?: 'Easy' | 'Medium' | 'Hard',
    category?: string
  ): Question | null {
    if (this.questions.length === 0) {
      console.log('❌ [RN 0.79.5] No questions available in getRandomQuestionSync');
      return null;
    }

    console.log('🔍 [RN 0.79.5] Filtering questions:', { 
      total: this.questions.length, 
      difficulty, 
      category,
      recentlyUsed: this.lastUsedQuestions.length 
    });

    // Filter questions based on criteria
    let availableQuestions = this.questions.filter(question => {
      // Filter by difficulty
      if (difficulty && question.difficulty !== difficulty) {
        return false;
      }
      
      // Filter by category
      if (category && question.category.toLowerCase() !== category.toLowerCase()) {
        return false;
      }
      
      // Avoid recently used questions (but allow if no others available)
      return true;
    });

    console.log('📊 [RN 0.79.5] After initial filtering:', availableQuestions.length, 'questions');

    if (availableQuestions.length === 0) {
      console.log('⚠️ [RN 0.79.5] No questions match criteria, returning random question');
      availableQuestions = this.questions;
    }

    // Remove recently used questions if we have enough alternatives
    const nonRecentQuestions = availableQuestions.filter(
      question => !this.lastUsedQuestions.includes(question.id)
    );

    if (nonRecentQuestions.length > 0) {
      availableQuestions = nonRecentQuestions;
      console.log('📊 [RN 0.79.5] After removing recent questions:', availableQuestions.length, 'questions');
    } else {
      console.log('⚠️ [RN 0.79.5] All matching questions recently used, allowing repeats');
    }

    // Select random question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    if (!selectedQuestion) {
      console.log('❌ [RN 0.79.5] Failed to select random question');
      return null;
    }

    // Track recently used questions
    this.lastUsedQuestions.push(selectedQuestion.id);
    
    // Limit the size of recently used questions array
    if (this.lastUsedQuestions.length > this.maxRecentQuestions) {
      this.lastUsedQuestions = this.lastUsedQuestions.slice(-this.maxRecentQuestions);
    }

    console.log('✅ [RN 0.79.5] Selected question:', {
      id: selectedQuestion.id,
      category: selectedQuestion.category,
      difficulty: selectedQuestion.difficulty,
      questionPreview: selectedQuestion.question.substring(0, 50) + '...'
    });

    return selectedQuestion;
  }

  getQuestionsByCategory(category: string): Question[] {
    if (!this.isInitialized || this.questions.length === 0) {
      console.log('⚠️ [RN 0.79.5] Service not ready for getQuestionsByCategory');
      return [];
    }

    return this.questions.filter(
      question => question.category.toLowerCase() === category.toLowerCase()
    );
  }

  getQuestionsByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): Question[] {
    if (!this.isInitialized || this.questions.length === 0) {
      console.log('⚠️ [RN 0.79.5] Service not ready for getQuestionsByDifficulty');
      return [];
    }

    return this.questions.filter(question => question.difficulty === difficulty);
  }

  getAvailableCategories(): string[] {
    if (!this.isInitialized || this.questions.length === 0) {
      console.log('⚠️ [RN 0.79.5] Service not ready for getAvailableCategories');
      return [];
    }

    return [...new Set(this.questions.map(question => question.category))];
  }

  getTotalQuestionCount(): number {
    return this.questions.length;
  }

  isServiceReady(): boolean {
    const ready = this.isInitialized && this.questions.length > 0 && !this.isLoading;
    console.log('🔍 [RN 0.79.5] Service ready check:', {
      initialized: this.isInitialized,
      questionsCount: this.questions.length,
      loading: this.isLoading,
      ready
    });
    return ready;
  }

  getServiceStatus() {
    return {
      initialized: this.isInitialized,
      loading: this.isLoading,
      questionsCount: this.questions.length,
      recentQuestionsCount: this.lastUsedQuestions.length,
      categories: this.getAvailableCategories(),
      ready: this.isServiceReady(),
      rnVersion: '0.79.5',
    };
  }

  // Debug method for troubleshooting
  debugService() {
    console.log('\n🔍 [RN 0.79.5] QUESTION SERVICE DEBUG INFO:');
    console.log('==========================================');
    console.log('Initialized:', this.isInitialized);
    console.log('Loading:', this.isLoading);
    console.log('Questions count:', this.questions.length);
    console.log('Recent questions:', this.lastUsedQuestions.length);
    console.log('Service ready:', this.isServiceReady());
    
    if (this.questions.length > 0) {
      console.log('Sample question:', {
        id: this.questions[0].id,
        category: this.questions[0].category,
        difficulty: this.questions[0].difficulty,
        hasCorrectAnswer: !!this.questions[0].correct_answer,
      });
    }
    
    const categories = this.getAvailableCategories();
    console.log('Categories:', categories);
    console.log('RN Version: 0.79.5');
    console.log('==========================================\n');
  }

  // Reset recently used questions (for testing or reset functionality)
  resetRecentQuestions(): void {
    console.log('🔄 [RN 0.79.5] Resetting recently used questions');
    this.lastUsedQuestions = [];
  }
}

export default new QuestionServiceClass();