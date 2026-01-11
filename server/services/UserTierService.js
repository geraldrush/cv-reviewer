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
    const score = this.calculateBasicScore(cvText, jobDescription);
    const analysis = {
      overallScore: score,
      basicFeedback: this.getBasicFeedback(cvText, jobDescription, score),
      keywordMatch: this.basicKeywordMatch(cvText, jobDescription),
      summary: {
        verdict: score <= 15 ? 'WRONG DOCUMENT/INDUSTRY' : 
                score <= 30 ? 'NEEDS MAJOR IMPROVEMENT' : 
                score <= 60 ? 'FAIR MATCH' : 'GOOD MATCH',
        majorWeaknesses: this.getBasicWeaknesses(cvText, jobDescription, score)
      },
      isPremiumRequired: true
    };
    
    return analysis;
  }

  calculateBasicScore(cvText, jobDescription) {
    // CRITICAL: Check for cover letter first
    if (cvText.toLowerCase().includes('cover letter') || cvText.toLowerCase().includes('dear hiring')) {
      return 5; // Cover letters get 5%
    }
    
    // Check for obvious mismatches
    const jobLower = jobDescription.toLowerCase();
    const cvLower = cvText.toLowerCase();
    
    const techJob = /\b(developer|engineer|programmer|software|frontend|backend|javascript|react|node|python)\b/i.test(jobLower);
    const caregiverCV = /\b(caregiver|care|patient|elderly|nursing|medical|healthcare)\b/i.test(cvLower);
    
    if (techJob && caregiverCV) {
      return 15; // Wrong industry gets 15% MAX
    }
    
    // Check keyword overlap first
    const jobWords = jobDescription.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const cvWords = cvText.toLowerCase().split(/\s+/);
    const matches = jobWords.filter(word => cvWords.includes(word)).length;
    const keywordMatch = jobWords.length > 0 ? (matches / jobWords.length) * 100 : 0;
    
    // If very low keyword match, cap the score
    if (keywordMatch < 10) {
      return Math.min(25, keywordMatch + 10); // Max 25% for very low matches
    }
    
    let score = 0;
    
    // Basic checks only if keywords match reasonably
    if (cvText.includes('@')) score += 10; // Has email
    if (/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(cvText)) score += 10; // Has phone
    if (cvText.length > 500) score += 20; // Sufficient length
    if (cvText.includes('•') || cvText.includes('-')) score += 15; // Has bullets
    
    // Add keyword score
    score += Math.min(45, keywordMatch);
    
    return Math.min(100, score);
  }

  getBasicWeaknesses(cvText, jobDescription, score) {
    const weaknesses = [];
    
    if (cvText.toLowerCase().includes('cover letter') || cvText.toLowerCase().includes('dear hiring')) {
      weaknesses.push('CRITICAL: This is a cover letter, not a CV');
      weaknesses.push('Please upload your actual CV/resume document');
      return weaknesses;
    }
    
    const jobLower = jobDescription.toLowerCase();
    const cvLower = cvText.toLowerCase();
    
    const techJob = /\b(developer|engineer|programmer|software|frontend|backend|javascript|react|node|python)\b/i.test(jobLower);
    const caregiverCV = /\b(caregiver|care|patient|elderly|nursing|medical|healthcare)\b/i.test(cvLower);
    
    if (techJob && caregiverCV) {
      weaknesses.push('MAJOR MISMATCH: CV is for healthcare/caregiving, job is for tech');
      weaknesses.push('You need a tech-focused CV for this position');
      return weaknesses;
    }
    
    if (score <= 30) {
      weaknesses.push('Very low keyword match with job requirements');
      weaknesses.push('CV may be for a different industry or role');
    }
    
    return weaknesses;
  }
  getBasicFeedback(cvText, jobDescription, score) {
    const feedback = [];
    
    if (score <= 15) {
      feedback.push('Document type or industry mismatch detected');
      return feedback;
    }
    
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