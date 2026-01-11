const OpenAI = require('openai');

class EnhancedCVIntelligence {
  constructor(openaiApiKey) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    
    // Industry-specific keywords and weights
    this.industryKeywords = {
      tech: {
        skills: ['javascript', 'python', 'react', 'node', 'aws', 'docker', 'kubernetes', 'api', 'database', 'sql', 'nosql', 'mongodb', 'postgresql', 'redis', 'git', 'ci/cd', 'microservices', 'agile', 'scrum'],
        tools: ['jira', 'confluence', 'slack', 'github', 'gitlab', 'jenkins', 'terraform', 'ansible'],
        metrics: ['uptime', 'latency', 'throughput', 'performance', 'scalability', 'users', 'traffic', 'load'],
        weight: 1.2
      },
      finance: {
        skills: ['excel', 'sql', 'python', 'r', 'tableau', 'powerbi', 'financial modeling', 'risk management', 'compliance', 'audit'],
        tools: ['bloomberg', 'reuters', 'sap', 'oracle', 'quickbooks'],
        metrics: ['revenue', 'profit', 'roi', 'cost reduction', 'budget', 'variance', 'compliance rate'],
        weight: 1.1
      },
      marketing: {
        skills: ['seo', 'sem', 'google analytics', 'facebook ads', 'content marketing', 'email marketing', 'social media'],
        tools: ['hubspot', 'salesforce', 'mailchimp', 'hootsuite', 'canva', 'photoshop'],
        metrics: ['conversion rate', 'ctr', 'cpc', 'roas', 'engagement', 'reach', 'impressions'],
        weight: 1.0
      },
      sales: {
        skills: ['crm', 'lead generation', 'cold calling', 'negotiation', 'account management', 'pipeline management'],
        tools: ['salesforce', 'hubspot', 'pipedrive', 'linkedin sales navigator'],
        metrics: ['quota', 'revenue', 'conversion rate', 'pipeline value', 'deals closed', 'retention rate'],
        weight: 1.1
      }
    };

    // Enhanced action verbs by impact level
    this.actionVerbs = {
      leadership: ['led', 'managed', 'directed', 'supervised', 'coordinated', 'orchestrated', 'spearheaded', 'championed'],
      achievement: ['achieved', 'delivered', 'exceeded', 'surpassed', 'accomplished', 'attained', 'realized'],
      creation: ['built', 'created', 'developed', 'designed', 'established', 'launched', 'implemented', 'engineered'],
      improvement: ['optimized', 'enhanced', 'improved', 'streamlined', 'transformed', 'revolutionized', 'modernized'],
      growth: ['increased', 'grew', 'expanded', 'scaled', 'boosted', 'accelerated', 'maximized']
    };

    // ATS-friendly format patterns
    this.atsPatterns = {
      goodFormats: [
        /^[A-Z][a-z]+ [A-Z][a-z]+$/,  // Standard name format
        /^\+?[\d\s\-\(\)]+$/,          // Phone number
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email
      ],
      badFormats: [
        /[^\x00-\x7F]/,                // Non-ASCII characters
        /\t/,                          // Tabs
        /\s{3,}/,                      // Multiple spaces
      ]
    };
  }

  detectIndustry(jobDescription, cvText) {
    const text = (jobDescription + ' ' + cvText).toLowerCase();
    let bestMatch = 'tech';
    let highestScore = 0;

    Object.entries(this.industryKeywords).forEach(([industry, data]) => {
      const score = data.skills.reduce((acc, skill) => {
        return acc + (text.includes(skill.toLowerCase()) ? 1 : 0);
      }, 0);
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = industry;
      }
    });

    return bestMatch;
  }

  analyzeKeywordMatch(cvText, jobDescription, industry) {
    const jobWords = this.extractKeywords(jobDescription.toLowerCase());
    const cvWords = this.extractKeywords(cvText.toLowerCase());
    const industryData = this.industryKeywords[industry] || this.industryKeywords.tech;

    // More aggressive mismatch detection
    const jobIndustry = this.detectIndustry(jobDescription, '');
    const cvIndustry = this.detectIndustry('', cvText);
    
    // Check for obvious industry mismatches
    const industryOverlap = this.calculateIndustryOverlap(jobWords, cvWords);
    const hasRelevantSkills = industryData.skills.some(skill => cvWords.includes(skill.toLowerCase()));
    
    // CRITICAL: Detect major mismatches (e.g., caregiver CV for tech job)
    const isMismatch = (
      jobIndustry !== cvIndustry && 
      industryOverlap < 0.15 && 
      !hasRelevantSkills
    ) || (
      // Additional check for completely unrelated content
      this.isCompletelyUnrelated(jobDescription, cvText)
    );

    // Categorize keywords
    const mandatory = jobWords.filter(word => 
      jobDescription.toLowerCase().includes('required') && 
      jobDescription.toLowerCase().includes(word)
    );
    
    const preferred = jobWords.filter(word => 
      (jobDescription.toLowerCase().includes('preferred') || 
       jobDescription.toLowerCase().includes('nice to have')) && 
      jobDescription.toLowerCase().includes(word)
    );

    const skills = industryData.skills.filter(skill => jobWords.includes(skill));
    const tools = industryData.tools.filter(tool => jobWords.includes(tool));

    const mandatoryMatched = mandatory.filter(word => cvWords.includes(word)).length;
    const skillsMatched = skills.filter(skill => cvWords.includes(skill)).length;

    return {
      isMismatch,
      mismatchPenalty: isMismatch ? 0.2 : 1.0, // 80% penalty for mismatched CVs
      mandatory: {
        total: mandatory.length,
        matched: mandatoryMatched,
        missing: mandatory.filter(word => !cvWords.includes(word)),
        percentage: mandatory.length ? (mandatoryMatched / mandatory.length) * 100 : 0
      },
      preferred: {
        total: preferred.length,
        matched: preferred.filter(word => cvWords.includes(word)).length,
        percentage: preferred.length ? (preferred.filter(word => cvWords.includes(word)).length / preferred.length) * 100 : 0
      },
      skills: {
        total: skills.length,
        matched: skillsMatched,
        percentage: skills.length ? (skillsMatched / skills.length) * 100 : 0
      },
      tools: {
        total: tools.length,
        matched: tools.filter(tool => cvWords.includes(tool)).length,
        percentage: tools.length ? (tools.filter(tool => cvWords.includes(tool)).length / tools.length) * 100 : 0
      }
    };
  }

  calculateIndustryOverlap(jobWords, cvWords) {
    const commonWords = jobWords.filter(word => cvWords.includes(word));
    return commonWords.length / Math.max(jobWords.length, cvWords.length);
  }

  isCompletelyUnrelated(jobDescription, cvText) {
    const jobLower = jobDescription.toLowerCase();
    const cvLower = cvText.toLowerCase();
    
    // CRITICAL: Check if document is explicitly a cover letter
    if (cvLower.includes('cover letter') || cvLower.includes('dear hiring')) {
      return true;
    }
    
    // Check for obvious mismatches
    const techJob = /\b(developer|engineer|programmer|software|frontend|backend|fullstack|javascript|react|node|python)\b/i.test(jobLower);
    const caregiverCV = /\b(caregiver|care|patient|elderly|nursing|medical|healthcare|assist|support)\b/i.test(cvLower);
    
    if (techJob && caregiverCV) {
      return true;
    }
    
    // Check for cover letter patterns
    const coverLetterPatterns = [
      /dear\s+(hiring|sir|madam|team)/i,
      /sincerely\s+yours/i,
      /i\s+am\s+(writing|applying|interested)/i,
      /thank\s+you\s+for\s+(your|considering)/i
    ];
    
    if (coverLetterPatterns.some(pattern => pattern.test(cvLower))) {
      return true;
    }
    
    return false;
  }

  analyzeBulletQuality(bullet, industry) {
    const analysis = {
      original: bullet,
      score: 0,
      factors: {},
      issues: [],
      suggestions: []
    };

    // Action verb analysis (weighted by type)
    let actionVerbScore = 0;
    let actionVerbType = null;
    
    Object.entries(this.actionVerbs).forEach(([type, verbs]) => {
      const hasVerb = verbs.some(verb => new RegExp(`\\b${verb}\\b`, 'i').test(bullet));
      if (hasVerb) {
        actionVerbType = type;
        actionVerbScore = type === 'leadership' ? 30 : type === 'achievement' ? 25 : 20;
      }
    });

    analysis.factors.actionVerb = { score: actionVerbScore, type: actionVerbType };

    // Metrics analysis (enhanced)
    const metricPatterns = [
      /\d+%/g,                    // Percentages
      /\$[\d,]+/g,               // Money
      /\d+[kmb]/gi,              // Large numbers (k, m, b)
      /\d+\s*(hours?|days?|weeks?|months?|years?)/gi, // Time
      /\d+\s*(users?|customers?|clients?)/gi,         // People
      /\d+x/gi,                  // Multipliers
    ];

    const metrics = metricPatterns.reduce((acc, pattern) => {
      const matches = bullet.match(pattern);
      return acc + (matches ? matches.length : 0);
    }, 0);

    const metricScore = Math.min(metrics * 15, 35); // Max 35 points
    analysis.factors.metrics = { score: metricScore, count: metrics };

    // Industry-specific skills
    const industryData = this.industryKeywords[industry] || this.industryKeywords.tech;
    const skillMatches = industryData.skills.filter(skill => 
      new RegExp(`\\b${skill}\\b`, 'i').test(bullet)
    ).length;
    
    const skillScore = Math.min(skillMatches * 10, 20);
    analysis.factors.skills = { score: skillScore, matches: skillMatches };

    // Business impact keywords
    const impactKeywords = ['revenue', 'cost', 'efficiency', 'performance', 'productivity', 'quality', 'customer', 'user', 'team', 'process'];
    const impactMatches = impactKeywords.filter(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(bullet)
    ).length;
    
    const impactScore = Math.min(impactMatches * 8, 15);
    analysis.factors.impact = { score: impactScore, matches: impactMatches };

    // Calculate total score with industry weight
    const baseScore = actionVerbScore + metricScore + skillScore + impactScore;
    analysis.score = Math.round(baseScore * (industryData.weight || 1));

    // Generate issues and suggestions
    if (actionVerbScore === 0) {
      analysis.issues.push('Missing strong action verb');
      analysis.suggestions.push('Start with a powerful action verb like "Led", "Built", or "Achieved"');
    }

    if (metricScore < 15) {
      analysis.issues.push('Lacks quantifiable metrics');
      analysis.suggestions.push('Add specific numbers, percentages, or measurable outcomes');
    }

    if (skillScore === 0) {
      analysis.issues.push('No relevant technical skills mentioned');
      analysis.suggestions.push(`Include relevant ${industry} skills like ${industryData.skills.slice(0, 3).join(', ')}`);
    }

    return analysis;
  }

  calculateATSCompatibility(cvText) {
    let score = 100;
    const issues = [];

    // First check if this looks like a CV at all
    const cvIndicators = [
      /\b(experience|work|employment|career)\b/i,
      /\b(education|degree|university|college)\b/i,
      /\b(skills|competencies|expertise)\b/i,
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
      /\b(resume|cv|curriculum)\b/i
    ];

    const indicatorMatches = cvIndicators.filter(pattern => pattern.test(cvText)).length;
    if (indicatorMatches < 2) {
      score = Math.min(score, 20); // Severely penalize non-CV documents
      issues.push('Document does not appear to be a CV or resume');
    }

    // Format issues
    this.atsPatterns.badFormats.forEach(pattern => {
      if (pattern.test(cvText)) {
        score -= 10;
        issues.push('Contains ATS-unfriendly formatting');
      }
    });

    // Structure analysis
    const sections = ['experience', 'education', 'skills'];
    const missingSections = sections.filter(section => 
      !new RegExp(section, 'i').test(cvText)
    );

    score -= missingSections.length * 15;
    if (missingSections.length > 0) {
      issues.push(`Missing standard sections: ${missingSections.join(', ')}`);
    }

    // Contact info
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cvText);
    const hasPhone = /[\+]?[\d\s\-\(\)]{10,}/.test(cvText);

    if (!hasEmail) {
      score -= 20;
      issues.push('Missing email address');
    }
    if (!hasPhone) {
      score -= 15;
      issues.push('Missing phone number');
    }

    return {
      score: Math.max(score, 0),
      issues,
      recommendations: issues.map(issue => `Fix: ${issue}`)
    };
  }

  calculateRecruiterScore(cvText, bullets) {
    let score = 0;
    const factors = {};

    // First impression (top 1/3 of CV)
    const topThird = cvText.substring(0, cvText.length / 3);
    const hasStrongStart = /\b(led|managed|built|achieved|delivered)\b/i.test(topThird);
    factors.firstImpression = hasStrongStart ? 25 : 10;

    // Bullet quality distribution
    const strongBullets = bullets.filter(b => b.score >= 70).length;
    const bulletRatio = bullets.length ? strongBullets / bullets.length : 0;
    factors.bulletQuality = Math.round(bulletRatio * 30);

    // Readability
    const avgWordsPerBullet = bullets.reduce((acc, b) => acc + b.original.split(' ').length, 0) / bullets.length;
    factors.readability = avgWordsPerBullet > 15 && avgWordsPerBullet < 25 ? 20 : 10;

    // Career progression indicators
    const hasProgression = /\b(promoted|advanced|senior|lead|manager)\b/i.test(cvText);
    factors.progression = hasProgression ? 15 : 5;

    // Consistency
    const hasConsistentFormat = bullets.every(b => b.original.length > 20);
    factors.consistency = hasConsistentFormat ? 10 : 5;

    score = Object.values(factors).reduce((acc, val) => acc + val, 0);

    return {
      score: Math.min(score, 100),
      factors,
      stopReadingPoint: this.findStopReadingPoint(cvText, bullets)
    };
  }

  findStopReadingPoint(cvText, bullets) {
    const lines = cvText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Stop reading triggers
      if (line.match(/responsible for|duties include/i)) {
        return { line: i + 1, reason: 'Task-focused language detected' };
      }
      
      if (line.length > 100 && !line.match(/\d/)) {
        return { line: i + 1, reason: 'Long bullet without metrics' };
      }
      
      if (i > 20 && !bullets.slice(0, 5).some(b => b.score > 60)) {
        return { line: i + 1, reason: 'No strong bullets in first section' };
      }
    }
    
    return null;
  }

  extractKeywords(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'her', 'way', 'many', 'then', 'them', 'well', 'were'].includes(word));
  }

  generateOverallScore(atsScore, recruiterScore, keywordMatch, bulletScores) {
    // First validate if this is actually a CV
    const cvValidation = this.validateCVContent(bulletScores, keywordMatch);
    
    if (!cvValidation.isValidCV) {
      return Math.min(cvValidation.penalizedScore, 20); // Cap at 20% for non-CVs
    }

    // CRITICAL: Apply severe penalty for industry mismatches
    if (keywordMatch.isMismatch) {
      return Math.min(15, cvValidation.penalizedScore); // Max 15% for wrong industry
    }
    
    const weights = {
      ats: 0.3,
      recruiter: 0.25,
      keywords: 0.25,
      bullets: 0.2
    };

    const avgBulletScore = bulletScores.length ? 
      bulletScores.reduce((acc, b) => acc + b.score, 0) / bulletScores.length : 0;

    const keywordScore = (keywordMatch.mandatory.percentage * 0.6) + 
                        (keywordMatch.skills.percentage * 0.4);

    const baseScore = Math.round(
      (atsScore * weights.ats) +
      (recruiterScore * weights.recruiter) +
      (keywordScore * weights.keywords) +
      (avgBulletScore * weights.bullets)
    );

    // Apply mismatch penalty if any
    const mismatchPenalty = keywordMatch.mismatchPenalty || 1.0;
    return Math.round(baseScore * mismatchPenalty);
  }

  validateCVContent(bulletScores, keywordMatch) {
    let validationScore = 100;
    let issues = [];

    // CRITICAL: Check if this is a cover letter (immediate disqualification)
    if (bulletScores.length === 0) {
      validationScore = 5; // Almost zero for cover letters
      issues.push('Document appears to be a cover letter, not a CV');
      return {
        isValidCV: false,
        penalizedScore: 5,
        issues
      };
    }

    // Check if document has CV-like structure
    const hasProfessionalBullets = bulletScores.filter(b => 
      b.factors.actionVerb.score > 0 || b.factors.metrics.score > 0
    ).length;
    
    if (hasProfessionalBullets === 0) {
      validationScore -= 60;
      issues.push('No professional experience bullets detected');
    }

    // Check for career-related keywords
    const careerKeywords = keywordMatch.skills.matched + keywordMatch.tools.matched;
    if (careerKeywords === 0) {
      validationScore -= 40;
      issues.push('No professional skills or tools mentioned');
    }

    // Check bullet quality distribution
    const avgBulletScore = bulletScores.length ? 
      bulletScores.reduce((acc, b) => acc + b.score, 0) / bulletScores.length : 0;
    
    if (avgBulletScore < 10) {
      validationScore -= 50;
      issues.push('Content does not match CV format');
    }

    return {
      isValidCV: validationScore > 40,
      penalizedScore: Math.max(validationScore, 0),
      issues
    };
  }
  extractBullets(cvText) {
    return cvText.split('\n')
      .filter(line => /^[\s]*[•\-\*\d+\.]/.test(line))
      .map(line => line.replace(/^[\s]*[•\-\*\d+\.]/, '').trim())
      .filter(line => line.length > 10);
  }
}

module.exports = EnhancedCVIntelligence;