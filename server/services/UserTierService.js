class UserTierService {
  constructor() {
    this.tiers = {
      FREE: 'free',
      PREMIUM: 'premium'
    };
  }

  getUserTier(userToken) {
    // For now, check if user has premium token
    // Later: integrate with payment system
    return userToken === 'premium' ? this.tiers.PREMIUM : this.tiers.FREE;
  }

  canUseAI(userTier) {
    return userTier === this.tiers.PREMIUM;
  }

  canRewriteCV(userTier) {
    return userTier === this.tiers.PREMIUM;
  }

  canDownloadPDF(userTier) {
    return userTier === this.tiers.PREMIUM;
  }

  getBasicAnalysis(cvText, jobDescription) {
    // Code-based analysis without AI
    const analysis = {
      overallScore: this.calculateBasicScore(cvText, jobDescription),
      basicFeedback: this.getBasicFeedback(cvText),
      keywordMatch: this.basicKeywordMatch(cvText, jobDescription),
      isPremiumRequired: true
    };
    
    return analysis;
  }

  calculateBasicScore(cvText, jobDescription) {
    let score = 0;
    
    // Basic checks
    if (cvText.includes('@')) score += 10; // Has email
    if (/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(cvText)) score += 10; // Has phone
    if (cvText.length > 500) score += 20; // Sufficient length
    if (cvText.includes('•') || cvText.includes('-')) score += 15; // Has bullets
    
    // Keyword matching
    const jobWords = jobDescription.toLowerCase().split(/\s+/);
    const cvWords = cvText.toLowerCase().split(/\s+/);
    const matches = jobWords.filter(word => cvWords.includes(word)).length;
    score += Math.min(30, matches * 2);
    
    return Math.min(100, score);
  }

  getBasicFeedback(cvText) {
    const feedback = [];
    
    if (!cvText.includes('@')) {
      feedback.push('Add email address');
    }
    if (!/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(cvText)) {
      feedback.push('Add phone number');
    }
    if (cvText.length < 500) {
      feedback.push('CV is too short - add more details');
    }
    if (!cvText.includes('•') && !cvText.includes('-')) {
      feedback.push('Use bullet points for better readability');
    }
    
    return feedback;
  }

  basicKeywordMatch(cvText, jobDescription) {
    const jobWords = jobDescription.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const cvWords = cvText.toLowerCase();
    
    const missing = jobWords.filter(word => !cvWords.includes(word)).slice(0, 5);
    const found = jobWords.filter(word => cvWords.includes(word)).slice(0, 5);
    
    return {
      missing,
      found,
      matchPercentage: Math.round((found.length / (found.length + missing.length)) * 100)
    };
  }
}

module.exports = UserTierService;