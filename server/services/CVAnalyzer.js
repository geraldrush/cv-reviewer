const ATSSimulator = require('./ATSSimulator');
const RecruiterSimulator = require('./RecruiterSimulator');
const CVIntelligenceLayer = require('./CVIntelligenceLayer');
const CVRewriter = require('./CVRewriter');
const CVBuilder = require('./CVBuilder');

class CVAnalyzer {
  constructor(openaiApiKey) {
    this.atsSimulator = new ATSSimulator();
    this.recruiterSimulator = new RecruiterSimulator();
    this.intelligenceLayer = new CVIntelligenceLayer(openaiApiKey);
    this.cvRewriter = new CVRewriter(openaiApiKey);
    this.cvBuilder = new CVBuilder(openaiApiKey);
  }

  async analyzeCV(cvText, jobDescription, targetRole = '') {
    console.log('Starting CV analysis...');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      overallScore: 0,
      matchPercentage: 0,
      atsAnalysis: {},
      recruiterAnalysis: {},
      intelligenceAnalysis: {},
      recommendations: [],
      criticalIssues: [],
      improvements: [],
      summary: {}
    };

    try {
      // Run both brains in parallel
      const [atsResult, recruiterResult] = await Promise.all([
        this.atsSimulator.analyzeCV(cvText, jobDescription),
        this.recruiterSimulator.analyzeCV(cvText, jobDescription, targetRole)
      ]);

      analysis.atsAnalysis = atsResult;
      analysis.recruiterAnalysis = recruiterResult;

      // Run intelligence layer analysis
      const [bulletAnalysis, antiPatterns, biasCheck] = await Promise.all([
        this.intelligenceLayer.analyzeBulletLevel(cvText),
        this.intelligenceLayer.detectAntiPatterns(cvText),
        this.intelligenceLayer.detectBiasAndCompliance(cvText)
      ]);

      analysis.intelligenceAnalysis = {
        bullets: bulletAnalysis,
        antiPatterns: antiPatterns,
        biasCheck: biasCheck
      };

      // Calculate overall scores
      analysis.overallScore = this.calculateOverallScore(analysis);
      analysis.matchPercentage = this.calculateMatchPercentage(analysis);

      // Generate consolidated recommendations
      analysis.recommendations = this.consolidateRecommendations(analysis);
      analysis.criticalIssues = this.identifyCriticalIssues(analysis);
      analysis.improvements = this.generateImprovements(analysis);
      analysis.summary = this.generateSummary(analysis);

      console.log('CV analysis completed');
      return analysis;

    } catch (error) {
      console.error('Error in CV analysis:', error);
      throw new Error(`CV analysis failed: ${error.message}`);
    }
  }

  calculateOverallScore(analysis) {
    // Weighted scoring: ATS (40%) + Recruiter (40%) + Intelligence (20%)
    const atsScore = analysis.atsAnalysis.rankingScore || 0;
    const recruiterScore = analysis.recruiterAnalysis.scanScore || 0;
    const intelligenceScore = analysis.intelligenceAnalysis.bullets?.overallScore || 0;

    const weightedScore = (atsScore * 0.4) + (recruiterScore * 0.4) + (intelligenceScore * 0.2);
    return Math.round(weightedScore);
  }

  calculateMatchPercentage(analysis) {
    // Primary match based on mandatory keywords
    const mandatoryMatch = analysis.atsAnalysis.keywordMatch?.mandatory?.percentage || 0;
    const niceToHaveMatch = analysis.atsAnalysis.keywordMatch?.niceToHave?.percentage || 0;
    
    // Weighted: 70% mandatory, 30% nice-to-have
    return Math.round((mandatoryMatch * 0.7) + (niceToHaveMatch * 0.3));
  }

  consolidateRecommendations(analysis) {
    const allRecommendations = [
      ...(analysis.atsAnalysis.recommendations || []),
      ...(analysis.recruiterAnalysis.recommendations || []),
      ...(analysis.intelligenceAnalysis.bullets?.recommendations || [])
    ];

    // Sort by priority and deduplicate
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    return allRecommendations
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 8); // Top 8 recommendations
  }

  identifyCriticalIssues(analysis) {
    const issues = [];

    // ATS critical issues
    if (analysis.atsAnalysis.keywordMatch?.mandatory?.percentage < 50) {
      issues.push({
        type: 'ats_keywords',
        severity: 'critical',
        title: 'Low mandatory keyword match',
        description: `Only ${analysis.atsAnalysis.keywordMatch.mandatory.percentage}% of required keywords found`,
        impact: 'CV likely to be filtered out by ATS',
        fixTime: '30 minutes'
      });
    }

    // Recruiter critical issues
    if (analysis.recruiterAnalysis.stopReadingPoint) {
      issues.push({
        type: 'recruiter_engagement',
        severity: 'critical',
        title: 'Early recruiter dropout risk',
        description: analysis.recruiterAnalysis.stopReadingPoint.reason,
        impact: 'Recruiter stops reading before seeing qualifications',
        fixTime: '45 minutes'
      });
    }

    // Intelligence layer critical issues
    const weakBullets = analysis.intelligenceAnalysis.bullets?.bulletAnalysis?.filter(b => b.score < 40) || [];
    if (weakBullets.length > 3) {
      issues.push({
        type: 'bullet_quality',
        severity: 'critical',
        title: 'Multiple weak achievement statements',
        description: `${weakBullets.length} bullets lack impact and metrics`,
        impact: 'Fails to demonstrate value to employers',
        fixTime: '60 minutes'
      });
    }

    return issues;
  }

  generateImprovements(analysis) {
    const improvements = [];

    // ATS improvements
    if (analysis.atsAnalysis.parsingScore?.score < 90) {
      improvements.push({
        category: 'ats_optimization',
        title: 'Improve ATS parsing',
        actions: [
          'Simplify formatting and remove complex tables',
          'Use standard section headers',
          'Ensure clean text extraction'
        ],
        expectedImpact: '+15% ATS score'
      });
    }

    // Recruiter improvements
    if (analysis.recruiterAnalysis.firstImpressionScore < 80) {
      improvements.push({
        category: 'first_impression',
        title: 'Strengthen opening section',
        actions: [
          'Add clear role targeting in first line',
          'Include years of experience prominently',
          'Highlight key technical skills early'
        ],
        expectedImpact: '+25% recruiter engagement'
      });
    }

    // Bullet improvements
    const bulletsNeedingMetrics = analysis.intelligenceAnalysis.bullets?.bulletAnalysis?.filter(b => !b.hasMetric) || [];
    if (bulletsNeedingMetrics.length > 0) {
      improvements.push({
        category: 'achievement_metrics',
        title: 'Add quantifiable results',
        actions: [
          'Include specific percentages and numbers',
          'Show time savings and efficiency gains',
          'Quantify scope (team size, budget, users affected)'
        ],
        expectedImpact: '+30% overall impact'
      });
    }

    return improvements;
  }

  generateSummary(analysis) {
    const summary = {
      verdict: this.getVerdict(analysis.overallScore),
      keyStrengths: [],
      majorWeaknesses: [],
      quickWins: [],
      timeToImprove: this.estimateImprovementTime(analysis)
    };

    // Identify strengths
    if (analysis.atsAnalysis.rankingScore > 80) {
      summary.keyStrengths.push('Strong ATS compatibility');
    }
    if (analysis.recruiterAnalysis.scanScore > 80) {
      summary.keyStrengths.push('Excellent recruiter appeal');
    }
    if (analysis.intelligenceAnalysis.bullets?.overallScore > 80) {
      summary.keyStrengths.push('High-impact achievement statements');
    }

    // Identify weaknesses
    if (analysis.atsAnalysis.keywordMatch?.mandatory?.percentage < 70) {
      summary.majorWeaknesses.push('Missing critical job keywords');
    }
    if (analysis.recruiterAnalysis.stopReadingPoint) {
      summary.majorWeaknesses.push('Poor recruiter engagement');
    }

    // Quick wins
    if (analysis.atsAnalysis.filteringIssues?.length > 0) {
      summary.quickWins.push('Add missing contact information');
    }
    if (analysis.intelligenceAnalysis.antiPatterns?.length > 0) {
      summary.quickWins.push('Replace weak language with action verbs');
    }

    return summary;
  }

  getVerdict(score) {
    if (score >= 85) return 'Excellent - Ready for applications';
    if (score >= 70) return 'Good - Minor improvements needed';
    if (score >= 55) return 'Fair - Significant improvements required';
    return 'Poor - Major revision needed';
  }

  estimateImprovementTime(analysis) {
    const criticalIssues = analysis.criticalIssues?.length || 0;
    const improvements = analysis.improvements?.length || 0;
    
    if (criticalIssues > 2) return '2-3 hours';
    if (criticalIssues > 0 || improvements > 2) return '1-2 hours';
    return '30-60 minutes';
  }

  // Utility method for job-specific analysis
  async analyzeForSpecificJob(cvText, jobDescription, companyName, roleName) {
    const targetRole = `${roleName} at ${companyName}`;
    const analysis = await this.analyzeCV(cvText, jobDescription, targetRole);
    
    // Add job-specific insights
    analysis.jobSpecific = {
      companyName,
      roleName,
      fitScore: this.calculateJobFitScore(analysis, jobDescription),
      customRecommendations: this.generateJobSpecificRecommendations(analysis, jobDescription)
    };

    return analysis;
  }

  calculateJobFitScore(analysis, jobDescription) {
    // Enhanced fit calculation based on job description analysis
    const baseScore = analysis.matchPercentage;
    
    // Bonus for role-specific keywords
    const roleKeywords = this.extractRoleKeywords(jobDescription);
    const matchedKeywords = analysis.atsAnalysis.keywordMatch?.mandatory?.matched || [];
    const hasRoleKeywords = roleKeywords.some(keyword => 
      Array.isArray(matchedKeywords) && matchedKeywords.includes(keyword)
    );
    
    return hasRoleKeywords ? Math.min(100, baseScore + 10) : baseScore;
  }

  extractRoleKeywords(jobDescription) {
    // Extract role-specific terms
    const rolePatterns = [
      /(?:senior|lead|principal|staff)\s+(?:engineer|developer|designer)/gi,
      /(?:full.?stack|frontend|backend|devops)/gi,
      /(?:react|angular|vue|node|python|java)/gi
    ];
    
    const keywords = [];
    rolePatterns.forEach(pattern => {
      const matches = jobDescription.match(pattern) || [];
      keywords.push(...matches.map(m => m.toLowerCase()));
    });
    
    return [...new Set(keywords)];
  }

  generateJobSpecificRecommendations(analysis, jobDescription) {
    const recommendations = [];
    
    // Add job-specific keyword recommendations
    const missingKeywords = analysis.atsAnalysis.keywordMatch?.mandatory?.missing || [];
    if (missingKeywords.length > 0) {
      recommendations.push({
        type: 'job_keywords',
        title: 'Add job-specific keywords',
        description: `Critical missing keywords: ${missingKeywords.slice(0, 8).join(', ')}. Add these naturally throughout your CV to increase match score by 25-40%.`,
        priority: 'critical',
        impact: `+${Math.min(40, missingKeywords.length * 5)}% match score`
      });
    }
    
    // Add specific improvement suggestions
    if (analysis.recruiterAnalysis?.bulletAnalysis?.withMetrics < analysis.recruiterAnalysis?.bulletAnalysis?.total * 0.6) {
      recommendations.push({
        type: 'metrics',
        title: 'Add quantifiable metrics',
        description: 'Include specific numbers, percentages, and timeframes in your achievements. Example: "Increased sales by 25%" instead of "Improved sales"',
        priority: 'high',
        impact: '+20% recruiter appeal'
      });
    }
    
    return recommendations;
  }
}

module.exports = CVAnalyzer;