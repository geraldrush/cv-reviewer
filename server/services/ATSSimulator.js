const natural = require('natural');
const compromise = require('compromise');

class ATSSimulator {
  constructor() {
    this.sectionPatterns = {
      experience: /(?:experience|work|employment|career)/i,
      education: /(?:education|academic|degree|university|college)/i,
      skills: /(?:skills|technical|technologies|tools)/i,
      contact: /(?:contact|personal|details)/i
    };
  }

  async analyzeCV(cvText, jobDescription) {
    const analysis = {
      parsingScore: 0,
      sectionDetection: {},
      keywordMatch: {},
      rankingScore: 0,
      filteringIssues: [],
      recommendations: []
    };

    analysis.parsingScore = this.calculateParsingScore(cvText);
    analysis.sectionDetection = this.detectSections(cvText);
    analysis.keywordMatch = await this.analyzeKeywords(cvText, jobDescription);
    analysis.rankingScore = this.calculateRankingScore(analysis);
    analysis.filteringIssues = this.detectFilteringIssues(cvText, jobDescription);
    analysis.recommendations = this.generateATSRecommendations(analysis);

    return analysis;
  }

  calculateParsingScore(cvText) {
    let score = 100;
    const issues = [];
    
    if (/[^\x00-\x7F]/g.test(cvText)) {
      score -= 15;
      issues.push('Non-ASCII characters detected');
    }
    
    if (cvText.includes('\t') || /\s{4,}/.test(cvText)) {
      score -= 10;
      issues.push('Complex formatting detected');
    }
    
    if (cvText.split('\n').length < 10) {
      score -= 20;
      issues.push('Insufficient text content');
    }

    return { score: Math.max(0, score), issues };
  }

  detectSections(cvText) {
    const sections = {};
    const lines = cvText.split('\n');
    
    Object.entries(this.sectionPatterns).forEach(([section, pattern]) => {
      const found = lines.find(line => pattern.test(line));
      sections[section] = {
        detected: !!found,
        confidence: found ? 75 : 0
      };
    });

    return sections;
  }

  async analyzeKeywords(cvText, jobDescription) {
    const jobKeywords = this.extractJobKeywords(jobDescription);
    const cvKeywords = this.extractCVKeywords(cvText);
    
    const mandatoryMatches = this.calculateKeywordMatches(cvKeywords, jobKeywords.mandatory);
    const niceToHaveMatches = this.calculateKeywordMatches(cvKeywords, jobKeywords.niceToHave);

    return {
      mandatory: {
        total: jobKeywords.mandatory.length,
        matched: mandatoryMatches.length,
        missing: jobKeywords.mandatory.filter(k => !mandatoryMatches.includes(k)),
        percentage: jobKeywords.mandatory.length > 0 ? (mandatoryMatches.length / jobKeywords.mandatory.length) * 100 : 0
      },
      niceToHave: {
        total: jobKeywords.niceToHave.length,
        matched: niceToHaveMatches.length,
        percentage: jobKeywords.niceToHave.length > 0 ? (niceToHaveMatches.length / jobKeywords.niceToHave.length) * 100 : 0
      }
    };
  }

  extractJobKeywords(jobDescription) {
    const requirements = this.extractRequirements(jobDescription);
    
    return {
      mandatory: requirements.filter(r => r.mandatory).map(r => r.keyword),
      niceToHave: requirements.filter(r => !r.mandatory).map(r => r.keyword)
    };
  }

  extractRequirements(jobDescription) {
    const requirements = [];
    const lines = jobDescription.split('\n');
    
    lines.forEach(line => {
      if (/(?:required|must|essential)/i.test(line)) {
        const keywords = this.extractKeywordsFromLine(line);
        keywords.forEach(keyword => {
          requirements.push({ keyword, mandatory: true });
        });
      } else if (/(?:preferred|nice|bonus|plus)/i.test(line)) {
        const keywords = this.extractKeywordsFromLine(line);
        keywords.forEach(keyword => {
          requirements.push({ keyword, mandatory: false });
        });
      }
    });

    return requirements;
  }

  extractKeywordsFromLine(line) {
    return line.toLowerCase()
      .split(/[,\s]+/)
      .filter(word => word.length > 2 && /^[a-z]+$/.test(word));
  }

  extractCVKeywords(cvText) {
    return cvText.toLowerCase()
      .split(/[,\s\n]+/)
      .filter(word => word.length > 2 && /^[a-z]+$/.test(word));
  }

  calculateKeywordMatches(cvKeywords, jobKeywords) {
    return jobKeywords.filter(jobKeyword => 
      cvKeywords.some(cvKeyword => 
        natural.JaroWinklerDistance(cvKeyword, jobKeyword) > 0.8
      )
    );
  }

  calculateRankingScore(analysis) {
    let score = 0;
    
    score += (analysis.parsingScore.score * 0.2);
    
    const sectionsFound = Object.values(analysis.sectionDetection)
      .filter(s => s.detected).length;
    score += (sectionsFound / 4) * 20;
    
    score += (analysis.keywordMatch.mandatory.percentage * 0.4);
    score += (analysis.keywordMatch.niceToHave.percentage * 0.2);

    return Math.round(score);
  }

  detectFilteringIssues(cvText, jobDescription) {
    const issues = [];
    
    if (!/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(cvText)) {
      issues.push({
        type: 'critical',
        message: 'No email address detected',
        impact: 'CV will be automatically rejected'
      });
    }
    
    if (!/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(cvText)) {
      issues.push({
        type: 'warning',
        message: 'No phone number detected',
        impact: 'May reduce callback likelihood'
      });
    }

    return issues;
  }

  generateATSRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.parsingScore.score < 80) {
      recommendations.push({
        priority: 'high',
        category: 'parsing',
        title: 'Fix parsing issues',
        description: 'Simplify formatting to improve ATS readability',
        impact: '+15% ATS score'
      });
    }
    
    if (analysis.keywordMatch.mandatory.percentage < 70) {
      recommendations.push({
        priority: 'critical',
        category: 'keywords',
        title: 'Add missing mandatory keywords',
        description: `Include: ${analysis.keywordMatch.mandatory.missing.slice(0, 3).join(', ')}`,
        impact: '+25% match rate'
      });
    }

    return recommendations;
  }
}

module.exports = ATSSimulator;