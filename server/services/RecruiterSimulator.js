class RecruiterSimulator {
  constructor() {
    this.scanPatterns = {
      fPattern: true,
      topThirdBias: true,
      titleCompanyBias: true,
      numbersBias: true,
      recencyBias: true
    };
    
    this.strongVerbs = [
      'built', 'led', 'shipped', 'delivered', 'created', 'developed',
      'managed', 'increased', 'reduced', 'improved', 'launched',
      'designed', 'implemented', 'optimized', 'scaled', 'achieved'
    ];
  }

  async analyzeCV(cvText, jobDescription, targetRole) {
    const analysis = {
      scanScore: 0,
      stopReadingPoint: null,
      firstImpressionScore: 0,
      bulletAnalysis: {},
      careerProgression: {},
      recruiterFeedback: [],
      recommendations: []
    };

    analysis.scanScore = this.calculateScanScore(cvText);
    analysis.stopReadingPoint = this.findStopReadingPoint(cvText);
    analysis.firstImpressionScore = this.analyzeFirstImpression(cvText, targetRole);
    analysis.bulletAnalysis = this.analyzeBullets(cvText);
    analysis.careerProgression = this.analyzeCareerProgression(cvText);
    analysis.recruiterFeedback = this.generateRecruiterFeedback(analysis);
    analysis.recommendations = this.generateRecruiterRecommendations(analysis);

    return analysis;
  }

  calculateScanScore(cvText) {
    const lines = cvText.split('\n').filter(line => line.trim());
    let score = 0;
    
    // F-pattern scanning simulation
    const topSection = lines.slice(0, 6);
    const hasTargetRole = topSection.some(line => 
      /(?:engineer|developer|manager|analyst|designer)/i.test(line)
    );
    if (hasTargetRole) score += 20;

    // Key tools in top section
    const hasTools = topSection.some(line => 
      /(?:javascript|python|react|node|aws|sql)/i.test(line)
    );
    if (hasTools) score += 15;

    // Years of experience visible
    const hasExperience = topSection.some(line => 
      /\d+\s*(?:years?|yrs?)/i.test(line)
    );
    if (hasExperience) score += 15;

    // Numbers bias - check for metrics
    const bulletsWithMetrics = this.countBulletsWithMetrics(cvText);
    const totalBullets = this.countTotalBullets(cvText);
    const metricsPercentage = totalBullets > 0 ? (bulletsWithMetrics / totalBullets) * 100 : 0;
    
    if (metricsPercentage >= 60) score += 25;
    else if (metricsPercentage >= 40) score += 15;
    else if (metricsPercentage >= 20) score += 5;

    // Strong verbs usage
    const strongVerbUsage = this.calculateStrongVerbUsage(cvText);
    score += Math.min(25, strongVerbUsage * 5);

    return Math.min(100, score);
  }

  findStopReadingPoint(cvText) {
    const lines = cvText.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const line = lines[i];
      
      // Stop if impact is unclear after job title
      if (i > 3 && /(?:responsible for|duties include|tasks)/i.test(line)) {
        return {
          line: i + 1,
          reason: 'Impact unclear - uses task language instead of achievements',
          confidence: 85
        };
      }
      
      // Stop if no metrics after several bullets
      if (i > 6 && !this.hasMetrics(lines.slice(0, i + 1))) {
        return {
          line: i + 1,
          reason: 'No quantifiable achievements found',
          confidence: 75
        };
      }
      
      // Stop if buzzwords without proof
      if (/(?:synergy|leverage|utilize|facilitate)/i.test(line) && !this.hasMetrics([line])) {
        return {
          line: i + 1,
          reason: 'Buzzwords without supporting metrics',
          confidence: 70
        };
      }
    }

    return null; // Recruiter reads full CV
  }

  analyzeFirstImpression(cvText, targetRole) {
    const topLines = cvText.split('\n').slice(0, 6);
    let score = 0;

    // Role clarity
    const hasRoleMatch = topLines.some(line => 
      line.toLowerCase().includes(targetRole?.toLowerCase() || '')
    );
    if (hasRoleMatch) score += 30;

    // Professional summary quality
    const hasSummary = topLines.some(line => line.length > 50);
    if (hasSummary) score += 20;

    // Contact info completeness
    const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(cvText);
    const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(cvText);
    if (hasEmail && hasPhone) score += 20;

    // LinkedIn/Portfolio
    const hasLinkedIn = /linkedin\.com/i.test(cvText);
    const hasPortfolio = /(?:github|portfolio|website)\.com/i.test(cvText);
    if (hasLinkedIn || hasPortfolio) score += 15;

    // Location clarity
    const hasLocation = /(?:city|state|country|remote)/i.test(cvText);
    if (hasLocation) score += 15;

    return score;
  }

  analyzeBullets(cvText) {
    const bullets = this.extractBullets(cvText);
    const analysis = {
      total: bullets.length,
      withMetrics: 0,
      withStrongVerbs: 0,
      withBusinessOutcome: 0,
      weakBullets: [],
      strongBullets: []
    };

    bullets.forEach((bullet, index) => {
      const bulletAnalysis = this.analyzeSingleBullet(bullet);
      
      if (bulletAnalysis.hasMetrics) analysis.withMetrics++;
      if (bulletAnalysis.hasStrongVerb) analysis.withStrongVerbs++;
      if (bulletAnalysis.hasBusinessOutcome) analysis.withBusinessOutcome++;
      
      if (bulletAnalysis.score < 40) {
        analysis.weakBullets.push({
          text: bullet,
          issues: bulletAnalysis.issues,
          suggestion: this.generateBulletSuggestion(bullet)
        });
      } else if (bulletAnalysis.score > 80) {
        analysis.strongBullets.push({
          text: bullet,
          strengths: bulletAnalysis.strengths
        });
      }
    });

    return analysis;
  }

  analyzeSingleBullet(bullet) {
    const analysis = {
      hasMetrics: false,
      hasStrongVerb: false,
      hasBusinessOutcome: false,
      score: 0,
      issues: [],
      strengths: []
    };

    // Check for metrics
    if (/\d+(?:%|\$|k|m|x|times)/i.test(bullet)) {
      analysis.hasMetrics = true;
      analysis.score += 30;
      analysis.strengths.push('Contains quantifiable metrics');
    } else {
      analysis.issues.push('Missing quantifiable metrics');
    }

    // Check for strong verbs
    const hasStrongVerb = this.strongVerbs.some(verb => 
      new RegExp(`\\b${verb}\\b`, 'i').test(bullet)
    );
    if (hasStrongVerb) {
      analysis.hasStrongVerb = true;
      analysis.score += 25;
      analysis.strengths.push('Uses strong action verb');
    } else {
      analysis.issues.push('Weak or passive language');
    }

    // Check for business outcome
    if (/(?:increased|reduced|improved|saved|generated|delivered)/i.test(bullet)) {
      analysis.hasBusinessOutcome = true;
      analysis.score += 25;
      analysis.strengths.push('Shows business impact');
    } else {
      analysis.issues.push('No clear business outcome');
    }

    // Check for task vs achievement language
    if (/(?:responsible for|duties|tasks|managed)/i.test(bullet)) {
      analysis.score -= 20;
      analysis.issues.push('Task-focused rather than achievement-focused');
    }

    return analysis;
  }

  analyzeCareerProgression(cvText) {
    const jobs = this.extractJobs(cvText);
    
    return {
      totalJobs: jobs.length,
      hasProgression: this.detectProgression(jobs),
      averageTenure: this.calculateAverageTenure(jobs),
      gapIssues: this.detectGaps(jobs),
      progressionScore: this.calculateProgressionScore(jobs)
    };
  }

  extractBullets(cvText) {
    return cvText.split('\n')
      .filter(line => /^[\s]*[•\-\*]/.test(line))
      .map(line => line.replace(/^[\s]*[•\-\*]/, '').trim());
  }

  extractJobs(cvText) {
    // Simplified job extraction
    const lines = cvText.split('\n');
    const jobs = [];
    
    lines.forEach((line, index) => {
      if (/\d{4}/.test(line) && /(?:present|current|\d{4})/i.test(line)) {
        jobs.push({
          title: lines[index - 1] || 'Unknown',
          duration: line,
          lineNumber: index
        });
      }
    });

    return jobs;
  }

  countBulletsWithMetrics(cvText) {
    const bullets = this.extractBullets(cvText);
    return bullets.filter(bullet => /\d+(?:%|\$|k|m|x|times)/i.test(bullet)).length;
  }

  countTotalBullets(cvText) {
    return this.extractBullets(cvText).length;
  }

  calculateStrongVerbUsage(cvText) {
    const bullets = this.extractBullets(cvText);
    const bulletsWithStrongVerbs = bullets.filter(bullet =>
      this.strongVerbs.some(verb => 
        new RegExp(`\\b${verb}\\b`, 'i').test(bullet)
      )
    );
    
    return bullets.length > 0 ? bulletsWithStrongVerbs.length / bullets.length : 0;
  }

  hasMetrics(lines) {
    return lines.some(line => /\d+(?:%|\$|k|m|x|times)/i.test(line));
  }

  detectProgression(jobs) {
    if (jobs.length < 2) return false;
    
    // Simple progression detection based on title keywords
    const seniorityKeywords = ['senior', 'lead', 'principal', 'manager', 'director'];
    let hasProgression = false;
    
    for (let i = 1; i < jobs.length; i++) {
      const currentJob = jobs[i].title.toLowerCase();
      const previousJob = jobs[i - 1].title.toLowerCase();
      
      const currentSeniority = seniorityKeywords.findIndex(keyword => 
        currentJob.includes(keyword)
      );
      const previousSeniority = seniorityKeywords.findIndex(keyword => 
        previousJob.includes(keyword)
      );
      
      if (currentSeniority > previousSeniority) {
        hasProgression = true;
        break;
      }
    }
    
    return hasProgression;
  }

  calculateAverageTenure(jobs) {
    // Simplified tenure calculation
    return jobs.length > 0 ? 2.5 : 0; // Placeholder
  }

  detectGaps(jobs) {
    return []; // Simplified - no gap detection in MVP
  }

  calculateProgressionScore(jobs) {
    let score = 0;
    
    if (jobs.length >= 2) score += 20;
    if (this.detectProgression(jobs)) score += 30;
    if (jobs.length <= 5) score += 20; // Not job hopping
    
    return Math.min(100, score);
  }

  generateBulletSuggestion(bullet) {
    // Simple bullet improvement suggestions
    if (!/\d/.test(bullet)) {
      return `Add specific metrics: "${bullet}" → "${bullet} resulting in X% improvement"`;
    }
    
    if (/responsible for/i.test(bullet)) {
      return bullet.replace(/responsible for/i, 'Led').replace(/managing/i, 'managing and delivered');
    }
    
    return `Strengthen with action verb and outcome: "${bullet}"`;
  }

  generateRecruiterFeedback(analysis) {
    const feedback = [];
    
    if (analysis.scanScore < 60) {
      feedback.push({
        type: 'critical',
        message: 'A recruiter would likely stop reading early due to unclear impact and missing metrics',
        suggestion: 'Focus on the first 6 lines - make your value proposition crystal clear'
      });
    }
    
    if (analysis.stopReadingPoint) {
      feedback.push({
        type: 'warning',
        message: `Recruiter likely stops reading at line ${analysis.stopReadingPoint.line}: ${analysis.stopReadingPoint.reason}`,
        suggestion: 'Restructure to lead with achievements, not responsibilities'
      });
    }
    
    if (analysis.bulletAnalysis.withMetrics / analysis.bulletAnalysis.total < 0.6) {
      feedback.push({
        type: 'improvement',
        message: 'Too few bullets contain metrics - recruiters scan for numbers',
        suggestion: 'Add quantifiable results to at least 60% of your bullets'
      });
    }

    return feedback;
  }

  generateRecruiterRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.firstImpressionScore < 70) {
      recommendations.push({
        priority: 'critical',
        category: 'first_impression',
        title: 'Improve first 6 lines',
        description: 'Make role, skills, and experience immediately clear',
        impact: 'Prevents early rejection'
      });
    }
    
    if (analysis.bulletAnalysis.weakBullets.length > 3) {
      recommendations.push({
        priority: 'high',
        category: 'bullets',
        title: 'Rewrite weak bullets',
        description: `${analysis.bulletAnalysis.weakBullets.length} bullets need metrics and stronger verbs`,
        impact: '+40% recruiter engagement'
      });
    }

    return recommendations;
  }
}

module.exports = RecruiterSimulator;