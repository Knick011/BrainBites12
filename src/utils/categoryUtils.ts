// src/utils/categoryUtils.ts
// Utility functions for managing quiz categories

import { questions } from '../assets/data/questionsData';

export interface CategoryInfo {
  id: string;
  name: string;
  displayName: string;
  questionCount: number;
  icon: string;
  color: string;
  gradient: string[];
}

// Extract unique categories from questions data
export const extractCategoriesFromData = (): CategoryInfo[] => {
  const categoryMap = new Map<string, number>();
  
  // Count questions per category with safety checks
  questions.forEach(question => {
    if (question && question.category && typeof question.category === 'string') {
      const category = question.category.toLowerCase().trim();
      if (category) { // Only process non-empty categories
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      }
    }
  });

  // Convert to CategoryInfo array with icons and colors
  const categories: CategoryInfo[] = [];
  
  categoryMap.forEach((count, categoryId) => {
    const categoryInfo = getCategoryDisplayInfo(categoryId);
    categories.push({
      id: categoryId,
      name: categoryId,
      displayName: categoryInfo.displayName,
      questionCount: count,
      icon: categoryInfo.icon,
      color: categoryInfo.color,
      gradient: categoryInfo.gradient
    });
  });

  // Sort by question count (descending) then by name
  return categories.sort((a, b) => {
    if (b.questionCount !== a.questionCount) {
      return b.questionCount - a.questionCount;
    }
    return a.displayName.localeCompare(b.displayName);
  });
};

// Get display information for a category
const getCategoryDisplayInfo = (categoryId: string) => {
  // Safety check for categoryId
  if (!categoryId || typeof categoryId !== 'string') {
    return {
      displayName: 'Unknown',
      icon: 'help-circle',
      color: '#9E9E9E',
      gradient: ['#BDBDBD', '#9E9E9E', '#757575']
    };
  }
  const categoryMappings: Record<string, { displayName: string; icon: string; color: string; gradient: string[] }> = {
    'science': {
      displayName: 'Science',
      icon: 'flask',
      color: '#4CAF50',
      gradient: ['#81C784', '#66BB6A', '#4CAF50']
    },
    'history': {
      displayName: 'History',
      icon: 'castle',
      color: '#8D6E63',
      gradient: ['#A1887F', '#8D6E63', '#795548']
    },
    'geography': {
      displayName: 'Geography',
      icon: 'earth',
      color: '#2196F3',
      gradient: ['#64B5F6', '#42A5F5', '#2196F3']
    },
    'literature': {
      displayName: 'Literature',
      icon: 'book-open-variant',
      color: '#9C27B0',
      gradient: ['#BA68C8', '#AB47BC', '#9C27B0']
    },
    'arts': {
      displayName: 'Arts',
      icon: 'palette',
      color: '#E91E63',
      gradient: ['#F06292', '#EC407A', '#E91E63']
    },
    'sports': {
      displayName: 'Sports',
      icon: 'soccer',
      color: '#FF5722',
      gradient: ['#FF8A65', '#FF7043', '#FF5722']
    },
    'entertainment': {
      displayName: 'Entertainment',
      icon: 'movie-open',
      color: '#FF9800',
      gradient: ['#FFB74D', '#FFA726', '#FF9800']
    },
    'technology': {
      displayName: 'Technology',
      icon: 'laptop',
      color: '#607D8B',
      gradient: ['#90A4AE', '#78909C', '#607D8B']
    },
    'mathematics': {
      displayName: 'Mathematics',
      icon: 'calculator',
      color: '#3F51B5',
      gradient: ['#7986CB', '#5C6BC0', '#3F51B5']
    },
    'general': {
      displayName: 'General Knowledge',
      icon: 'lightbulb',
      color: '#FFC107',
      gradient: ['#FFD54F', '#FFCA28', '#FFC107']
    }
  };

  // Get mapping or create default
  const mapping = categoryMappings[categoryId] || {
    displayName: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
    icon: 'help-circle',
    color: '#9E9E9E',
    gradient: ['#BDBDBD', '#9E9E9E', '#757575']
  };

  return mapping;
};

// Get all available categories
export const getAvailableCategories = (): CategoryInfo[] => {
  try {
    return extractCategoriesFromData();
  } catch (error) {
    console.error('❌ [CategoryUtils] Error extracting categories:', error);
    return []; // Return empty array as fallback
  }
};

// Get category by ID
export const getCategoryById = (categoryId: string): CategoryInfo | null => {
  const categories = getAvailableCategories();
  return categories.find(cat => cat.id === categoryId) || null;
};

// Get total questions count
export const getTotalQuestionsCount = (): number => {
  try {
    return questions?.length || 0;
  } catch (error) {
    console.error('❌ [CategoryUtils] Error getting total questions count:', error);
    return 0;
  }
};

// Debug logging - wrap in try-catch to prevent errors during initialization
try {
  console.log('📚 [CategoryUtils] Available categories:', getAvailableCategories().map(c => `${c.displayName} (${c.questionCount})`).join(', '));
} catch (error) {
  console.warn('⚠️ [CategoryUtils] Error during initialization:', error);
} 