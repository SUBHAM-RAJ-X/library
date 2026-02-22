class AICategoryService {
  constructor() {
    this.categories = [
      'Fiction',
      'Non-Fiction',
      'Science Fiction',
      'Fantasy',
      'Mystery',
      'Thriller',
      'Romance',
      'Biography',
      'History',
      'Science',
      'Technology',
      'Business',
      'Self-Help',
      'Education',
      'Children',
      'Young Adult',
      'Poetry',
      'Drama',
      'Travel',
      'Cooking',
      'Health',
      'Philosophy',
      'Religion',
      'Art',
      'Music',
      'Sports',
      'Politics',
      'Psychology',
      'Economics'
    ];

    this.keywords = {
      'Fiction': ['novel', 'story', 'fiction', 'tale', 'narrative'],
      'Non-Fiction': ['non-fiction', 'real', 'facts', 'documentary', 'biography'],
      'Science Fiction': ['sci-fi', 'science fiction', 'future', 'space', 'aliens', 'robot'],
      'Fantasy': ['fantasy', 'magic', 'dragon', 'wizard', 'mythical', 'sword'],
      'Mystery': ['mystery', 'detective', 'crime', 'murder', 'investigation'],
      'Thriller': ['thriller', 'suspense', 'psychological', 'horror'],
      'Romance': ['romance', 'love', 'relationship', 'romantic'],
      'Biography': ['biography', 'memoir', 'life story', 'autobiography'],
      'History': ['history', 'historical', 'ancient', 'medieval', 'war'],
      'Science': ['science', 'physics', 'chemistry', 'biology', 'research'],
      'Technology': ['technology', 'computer', 'programming', 'software', 'tech'],
      'Business': ['business', 'entrepreneur', 'startup', 'marketing', 'finance'],
      'Self-Help': ['self-help', 'personal development', 'motivation', 'success'],
      'Education': ['education', 'learning', 'teaching', 'academic', 'study'],
      'Children': ['children', 'kids', 'childhood', 'picture book'],
      'Young Adult': ['young adult', 'ya', 'teen', 'adolescent'],
      'Poetry': ['poetry', 'poem', 'verse', 'rhyme'],
      'Drama': ['drama', 'play', 'theater', 'script'],
      'Travel': ['travel', 'journey', 'adventure', 'guide'],
      'Cooking': ['cooking', 'recipe', 'food', 'culinary', 'chef'],
      'Health': ['health', 'medicine', 'fitness', 'wellness', 'diet'],
      'Philosophy': ['philosophy', 'philosophical', 'ethics', 'logic'],
      'Religion': ['religion', 'spiritual', 'faith', 'god', 'bible'],
      'Art': ['art', 'painting', 'drawing', 'design', 'artistic'],
      'Music': ['music', 'song', 'melody', 'instrument', 'composer'],
      'Sports': ['sports', 'athletic', 'game', 'competition', 'fitness'],
      'Politics': ['politics', 'government', 'policy', 'democracy'],
      'Psychology': ['psychology', 'mental', 'behavior', 'mind', 'therapy'],
      'Economics': ['economics', 'economy', 'financial', 'market', 'trade']
    };
  }

  // Detect category based on title and description
  async detectCategory(title, description = '') {
    try {
      const text = `${title} ${description}`.toLowerCase();
      const scores = {};

      // Calculate scores for each category
      for (const category of this.categories) {
        scores[category] = this.calculateCategoryScore(text, category);
      }

      // Get the category with the highest score
      const detectedCategory = Object.keys(scores).reduce((a, b) => 
        scores[a] > scores[b] ? a : b
      );

      // If the highest score is too low, return a default
      if (scores[detectedCategory] < 0.1) {
        return 'Fiction'; // Default category
      }

      return {
        category: detectedCategory,
        confidence: scores[detectedCategory],
        all_scores: scores
      };
    } catch (error) {
      console.error('AI Category detection error:', error);
      return {
        category: 'Fiction',
        confidence: 0.5,
        error: error.message
      };
    }
  }

  // Calculate score for a specific category
  calculateCategoryScore(text, category) {
    let score = 0;
    const keywords = this.keywords[category] || [];

    // Check for keyword matches
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 0.3;
      }
    }

    // Check for partial word matches
    const words = text.split(/\s+/);
    for (const word of words) {
      for (const keyword of keywords) {
        if (word.includes(keyword) || keyword.includes(word)) {
          score += 0.1;
        }
      }
    }

    // Add some randomness for variety (in real implementation, this would be ML-based)
    score += Math.random() * 0.1;

    return Math.min(score, 1.0);
  }

  // Get multiple category suggestions
  async getCategorySuggestions(title, description = '', limit = 3) {
    try {
      const result = await this.detectCategory(title, description);
      
      if (result.all_scores) {
        // Sort categories by score and return top suggestions
        const suggestions = Object.entries(result.all_scores)
          .sort(([,a], [,b]) => b - a)
          .slice(0, limit)
          .map(([category, score]) => ({
            category,
            confidence: score
          }));

        return suggestions;
      }

      return [{
        category: result.category,
        confidence: result.confidence || 0.5
      }];
    } catch (error) {
      console.error('Category suggestions error:', error);
      return [{
        category: 'Fiction',
        confidence: 0.5
      }];
    }
  }

  // Validate if a category exists
  isValidCategory(category) {
    return this.categories.includes(category);
  }

  // Get all available categories
  getAllCategories() {
    return this.categories;
  }

  // Get categories by group
  getCategoriesByGroup() {
    return {
      'Fiction & Literature': ['Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Thriller', 'Romance', 'Poetry', 'Drama'],
      'Non-Fiction': ['Non-Fiction', 'Biography', 'History', 'Science', 'Technology', 'Business', 'Self-Help', 'Education'],
      'Academic & Professional': ['Science', 'Technology', 'Business', 'Education', 'Philosophy', 'Politics', 'Psychology', 'Economics'],
      'Lifestyle & Hobbies': ['Travel', 'Cooking', 'Health', 'Sports', 'Art', 'Music'],
      'Age Specific': ['Children', 'Young Adult'],
      'Spiritual & Religious': ['Religion', 'Philosophy']
    };
  }

  // Enhanced detection using multiple factors
  async enhancedCategoryDetection(title, description = '', author = '') {
    try {
      const text = `${title} ${description} ${author}`.toLowerCase();
      
      // Base detection
      const baseResult = await this.detectCategory(title, description);
      
      // Author-based detection (if author is known for certain genres)
      const authorBonus = this.getAuthorCategoryBonus(author);
      
      // Title pattern detection
      const titlePatternBonus = this.getTitlePatternBonus(title);
      
      // Combine scores
      const finalScores = {};
      
      for (const category of this.categories) {
        let finalScore = baseResult.all_scores?.[category] || 0;
        finalScore += authorBonus[category] || 0;
        finalScore += titlePatternBonus[category] || 0;
        finalScores[category] = Math.min(finalScore, 1.0);
      }

      const finalCategory = Object.keys(finalScores).reduce((a, b) => 
        finalScores[a] > finalScores[b] ? a : b
      );

      return {
        category: finalCategory,
        confidence: finalScores[finalCategory],
        all_scores: finalScores,
        breakdown: {
          base: baseResult.all_scores || {},
          author_bonus: authorBonus,
          title_pattern_bonus: titlePatternBonus
        }
      };
    } catch (error) {
      console.error('Enhanced category detection error:', error);
      return {
        category: 'Fiction',
        confidence: 0.5,
        error: error.message
      };
    }
  }

  // Get author-based category bonus (simplified)
  getAuthorCategoryBonus(author) {
    const bonuses = {};
    
    if (!author) return bonuses;

    const authorLower = author.toLowerCase();
    
    // This would ideally use a database of known authors and their genres
    if (authorLower.includes('king')) {
      bonuses['Horror'] = 0.3;
      bonuses['Thriller'] = 0.2;
    }
    if (authorLower.includes('rowling')) {
      bonuses['Fantasy'] = 0.4;
      bonuses['Young Adult'] = 0.3;
    }
    
    return bonuses;
  }

  // Get title pattern bonus
  getTitlePatternBonus(title) {
    const bonuses = {};
    
    if (!title) return bonuses;

    const titleLower = title.toLowerCase();
    
    // Pattern detection
    if (titleLower.includes('guide to') || titleLower.includes('how to')) {
      bonuses['Self-Help'] = 0.2;
      bonuses['Education'] = 0.1;
    }
    
    if (titleLower.includes('history of') || titleLower.includes('the story of')) {
      bonuses['History'] = 0.3;
      bonuses['Biography'] = 0.2;
    }
    
    if (titleLower.match(/\d+\s+ways? to/)) {
      bonuses['Self-Help'] = 0.2;
      bonuses['Business'] = 0.1;
    }
    
    return bonuses;
  }
}

module.exports = new AICategoryService();
