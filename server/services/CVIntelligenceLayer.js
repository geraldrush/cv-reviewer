const OpenAI = require('openai');

class CVIntelligenceLayer {
  constructor(openaiApiKey) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    
    this.antiPatterns = [
      {
        pattern: /responsible for|duties include|tasks/i,
        type: 'task_list',
        severity: 'high',
        message: 'Task-focused language instead of impact'
      },
      {
        pattern: /(?:synergy|leverage|utilize|facilitate|optimize)(?!\s+\d)/i,
        type: 'buzzword_stuffing',
        severity: 'medium',
        message: 'Buzzwords without supporting metrics'
      },
      {
        pattern: /improved efficiency|enhanced performance|increased productivity/i,
        type: 'empty_metrics',
        severity: 'high',
        message: 'Vague improvements without specific numbers'
      }
    ];
    
    this.biasPatterns = [
      {
        pattern: /\b(?:19|20)\d{2}\b/,
        type: 'age_indicator',
        message: 'Graduation year may indicate age'
      },
      {
        pattern: /\b(?:he|she|his|her)\b/i,
        type: 'gendered_language',
        message: 'Gendered pronouns detected'
      },
      {
        pattern: /(?:married|single|children|family)/i,
        type: 'personal_info',
        message: 'Personal information ATS should ignore'
      }
    ];
  }

  async analyzeBulletLevel(cvText) {
    const bullets = this.extractBullets(cvText);
    const analysis = {
      totalBullets: bullets.length,
      bulletAnalysis: [],
      overallScore: 0,
      recommendations: []
    };

    for (const bullet of bullets) {
      const bulletAnalysis = await this.analyzeSingleBullet(bullet);
      analysis.bulletAnalysis.push(bulletAnalysis);
    }

    analysis.overallScore = this.calculateOverallBulletScore(analysis.bulletAnalysis);
    analysis.recommendations = this.generateBulletRecommendations(analysis.bulletAnalysis);

    return analysis;
  }

  async analyzeSingleBullet(bullet) {
    const analysis = {
      original: bullet,
      hasActionVerb: false,
      hasSkill: false,
      hasMetric: false,
      hasBusinessOutcome: false,
      score: 0,
      issues: [],
      rewrittenVersion: null
    };

    // Check for action verb
    const actionVerbs = ['built', 'led', 'created', 'developed', 'managed', 'increased', 'reduced', 'delivered'];
    analysis.hasActionVerb = actionVerbs.some(verb => 
      new RegExp(`\\b${verb}\\b`, 'i').test(bullet)
    );

    // Check for skills
    analysis.hasSkill = /(?:javascript|python|react|node|aws|sql|api|database)/i.test(bullet);

    // Check for metrics
    analysis.hasMetric = /\d+(?:%|\$|k|m|x|times|hours|days|weeks)/i.test(bullet);

    // Check for business outcome
    analysis.hasBusinessOutcome = /(?:revenue|cost|efficiency|performance|user|customer|time)/i.test(bullet);

    // Calculate score
    if (analysis.hasActionVerb) analysis.score += 25;
    if (analysis.hasSkill) analysis.score += 20;
    if (analysis.hasMetric) analysis.score += 30;
    if (analysis.hasBusinessOutcome) analysis.score += 25;

    // Identify issues
    if (!analysis.hasActionVerb) analysis.issues.push('Missing strong action verb');
    if (!analysis.hasMetric) analysis.issues.push('No quantifiable metrics');
    if (!analysis.hasBusinessOutcome) analysis.issues.push('Unclear business impact');

    // Generate rewrite if score is low
    if (analysis.score < 60) {
      analysis.rewrittenVersion = await this.rewriteBullet(bullet);
    }

    return analysis;
  }

  async rewriteBullet(bullet) {
    try {
      const prompt = `Rewrite this CV bullet point to be more impactful:

Original: "${bullet}"

Requirements:
- Start with a strong action verb (built, led, delivered, etc.)
- Include specific metrics or numbers
- Show clear business outcome
- Keep it concise (1-2 lines max)
- Make it achievement-focused, not task-focused

Return only the rewritten bullet point, nothing else.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error rewriting bullet:', error);
      return this.generateFallbackRewrite(bullet);
    }
  }

  generateFallbackRewrite(bullet) {
    // Simple rule-based rewrite as fallback
    let rewritten = bullet;
    
    // Replace weak verbs
    rewritten = rewritten.replace(/responsible for/i, 'Led');
    rewritten = rewritten.replace(/worked on/i, 'Developed');
    rewritten = rewritten.replace(/helped with/i, 'Contributed to');
    
    // Add placeholder metrics if none exist
    if (!/\d/.test(rewritten)) {
      rewritten += ', resulting in X% improvement';
    }
    
    return rewritten;
  }

  detectAntiPatterns(cvText) {
    const detectedPatterns = [];
    
    this.antiPatterns.forEach(antiPattern => {
      const matches = cvText.match(antiPattern.pattern);
      if (matches) {
        detectedPatterns.push({
          type: antiPattern.type,
          severity: antiPattern.severity,
          message: antiPattern.message,
          matches: matches,
          suggestions: this.getAntiPatternSuggestions(antiPattern.type)
        });
      }
    });

    return detectedPatterns;
  }

  detectBiasAndCompliance(cvText) {
    const issues = [];
    
    this.biasPatterns.forEach(pattern => {
      const matches = cvText.match(pattern.pattern);
      if (matches) {
        issues.push({
          type: pattern.type,
          message: pattern.message,
          matches: matches,
          recommendation: this.getBiasRecommendation(pattern.type)
        });
      }
    });

    return issues;
  }

  getAntiPatternSuggestions(type) {
    const suggestions = {
      task_list: [
        'Replace "responsible for" with "led", "built", or "delivered"',
        'Focus on achievements, not duties',
        'Add quantifiable outcomes'
      ],
      buzzword_stuffing: [
        'Replace buzzwords with specific actions',
        'Add metrics to support claims',
        'Use concrete examples'
      ],
      empty_metrics: [
        'Specify exact percentages or numbers',
        'Define what "efficiency" or "performance" means',
        'Include timeframes and scope'
      ]
    };

    return suggestions[type] || [];
  }

  getBiasRecommendation(type) {
    const recommendations = {
      age_indicator: 'Remove graduation years, keep only degree and institution',
      gendered_language: 'Use gender-neutral language throughout',
      personal_info: 'Remove personal details not relevant to job performance'
    };

    return recommendations[type] || 'Review for potential bias';
  }

  extractBullets(cvText) {
    return cvText.split('\n')
      .filter(line => /^[\s]*[•\-\*]/.test(line))
      .map(line => line.replace(/^[\s]*[•\-\*]/, '').trim())
      .filter(line => line.length > 10);
  }

  calculateOverallBulletScore(bulletAnalysis) {
    if (bulletAnalysis.length === 0) return 0;
    
    const totalScore = bulletAnalysis.reduce((sum, bullet) => sum + bullet.score, 0);
    return Math.round(totalScore / bulletAnalysis.length);
  }

  generateBulletRecommendations(bulletAnalysis) {
    const recommendations = [];
    const weakBullets = bulletAnalysis.filter(b => b.score < 60);
    
    if (weakBullets.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'bullets',
        title: `Rewrite ${weakBullets.length} weak bullets`,
        description: 'Add metrics, strong verbs, and business outcomes',
        impact: `+${Math.round(weakBullets.length * 15)}% overall CV strength`
      });
    }

    const bulletsWithoutMetrics = bulletAnalysis.filter(b => !b.hasMetric);
    if (bulletsWithoutMetrics.length > bulletAnalysis.length * 0.4) {
      recommendations.push({
        priority: 'critical',
        category: 'metrics',
        title: 'Add quantifiable metrics',
        description: `${bulletsWithoutMetrics.length} bullets lack specific numbers`,
        impact: 'Essential for ATS and recruiter screening'
      });
    }

    return recommendations;
  }

  async generateSectionAnalysis(cvText) {
    const sections = this.extractSections(cvText);
    const analysis = {};

    for (const [sectionName, content] of Object.entries(sections)) {
      analysis[sectionName] = await this.analyzeSectionQuality(sectionName, content);
    }

    return analysis;
  }

  extractSections(cvText) {
    const sections = {};
    const lines = cvText.split('\n');
    let currentSection = 'header';
    let currentContent = [];

    lines.forEach(line => {
      if (/^(?:experience|work|employment)/i.test(line.trim())) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n');
        }
        currentSection = 'experience';
        currentContent = [];
      } else if (/^(?:education|academic)/i.test(line.trim())) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n');
        }
        currentSection = 'education';
        currentContent = [];
      } else if (/^(?:skills|technical)/i.test(line.trim())) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n');
        }
        currentSection = 'skills';
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    });

    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n');
    }

    return sections;
  }

  async analyzeSectionQuality(sectionName, content) {
    const analysis = {
      wordCount: content.split(/\s+/).length,
      hasKeywords: false,
      structure: 'good',
      recommendations: []
    };

    switch (sectionName) {
      case 'experience':
        analysis.hasKeywords = /(?:led|built|delivered|managed)/i.test(content);
        if (!analysis.hasKeywords) {
          analysis.recommendations.push('Add strong action verbs');
        }
        break;
      
      case 'skills':
        analysis.hasKeywords = /(?:javascript|python|react|aws)/i.test(content);
        if (!analysis.hasKeywords) {
          analysis.recommendations.push('Include relevant technical skills');
        }
        break;
    }

    return analysis;
  }
}

module.exports = CVIntelligenceLayer;