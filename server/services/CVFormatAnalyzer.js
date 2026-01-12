/**
 * CVFormatAnalyzer - Analyzes CV structure, formatting, and visual presentation
 * Scores CV format separately from content quality
 */

class CVFormatAnalyzer {
  constructor() {
    this.sectionHeaders = [
      'summary', 'professional summary', 'objective',
      'experience', 'work experience', 'employment',
      'education', 'qualifications', 'certifications',
      'skills', 'technical skills', 'core competencies',
      'projects', 'achievements', 'awards'
    ];

    this.actionVerbs = [
      'achieved', 'accelerated', 'accomplished', 'added', 'administered',
      'advanced', 'advised', 'advocated', 'allocated', 'analyzed', 'anchored',
      'animated', 'announced', 'answered', 'anticipated', 'applied', 'appointed',
      'appraised', 'approved', 'arbitrated', 'architected', 'arranged', 'articulated',
      'ascertained', 'assembled', 'assessed', 'assigned', 'assimilated', 'assisted',
      'assured', 'attached', 'attained', 'attended', 'attracted', 'audited',
      'augmented', 'authored', 'automated', 'averted', 'awarded', 'backed', 'balanced',
      'banded', 'banked', 'bartered', 'based', 'began', 'believed', 'benefited',
      'bestowed', 'bid', 'billed', 'blazed', 'blended', 'blessed', 'bolstered',
      'boosted', 'borrowed', 'bottlenecked', 'bounced', 'bracketed', 'brainstormed',
      'branched', 'breached', 'broadened', 'brokered', 'budgeted', 'buffered',
      'built', 'bulleted', 'bumped', 'bundled', 'buoyed', 'calculated', 'calibrated'
    ];
  }

  /**
   * Main format analysis function
   */
  analyzeFormat(cvText) {
    const scores = {
      sectionStructure: this.analyzeSectionStructure(cvText),
      formatting: this.analyzeFormatting(cvText),
      bulletQuality: this.analyzeBulletPoints(cvText),
      contentDensity: this.analyzeContentDensity(cvText),
      keywordNaturalness: this.analyzeKeywordNaturalness(cvText),
      overallFormatScore: 0
    };

    // Calculate weighted overall format score
    scores.overallFormatScore = Math.round(
      (scores.sectionStructure * 0.25) +
      (scores.formatting * 0.20) +
      (scores.bulletQuality * 0.30) +
      (scores.contentDensity * 0.15) +
      (scores.keywordNaturalness * 0.10)
    );

    return scores;
  }

  /**
   * Check if CV has proper section structure
   */
  analyzeSectionStructure(cvText) {
    const lines = cvText.split('\n').map(l => l.trim().toLowerCase());
    let score = 0;
    const foundSections = new Set();

    // Check for standard sections
    lines.forEach(line => {
      this.sectionHeaders.forEach(header => {
        if (line.includes(header) && line.length < 50) {
          foundSections.add(header.split(' ')[0]);
        }
      });
    });

    // Scoring criteria
    const criticalSections = ['experience', 'education', 'skills'];
    const criticalFound = criticalSections.filter(s => 
      foundSections.has(s) || 
      Array.from(foundSections).some(fs => fs.startsWith(s.substring(0, 3)))
    ).length;

    score = Math.round((criticalFound / 3) * 100);

    // Bonus for additional sections
    if (foundSections.size >= 5) score = Math.min(100, score + 10);
    if (foundSections.size >= 7) score = Math.min(100, score + 10);

    // Deduct for too few sections
    if (foundSections.size < 2) score = Math.max(0, score - 20);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze formatting consistency and readability
   */
  analyzeFormatting(cvText) {
    let score = 80; // Start high, deduct for issues
    const lines = cvText.split('\n');
    
    // Check for excessive blank lines (sign of poor formatting)
    const blankLineRatio = lines.filter(l => l.trim() === '').length / lines.length;
    if (blankLineRatio > 0.3) score -= 15;
    if (blankLineRatio > 0.5) score -= 15;

    // Check for proper line length (too long = hard to read)
    const avgLineLength = lines
      .filter(l => l.trim().length > 0)
      .reduce((sum, line) => sum + line.length, 0) / 
      lines.filter(l => l.trim().length > 0).length;
    
    if (avgLineLength > 100) score -= 10;
    if (avgLineLength < 20) score -= 10;

    // Check for consistent spacing
    const indentationPatterns = this.checkIndentation(lines);
    if (!indentationPatterns.consistent) score -= 10;

    // Check for special characters abuse (signs of poor conversion)
    const specialCharRatio = (cvText.match(/[^a-zA-Z0-9\s\-.,]/g) || []).length / cvText.length;
    if (specialCharRatio > 0.05) score -= 15;

    // Check for all caps sections (bad formatting)
    const allCapsLines = lines.filter(l => l === l.toUpperCase() && l.trim().length > 3).length;
    if (allCapsLines > 5) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check indentation consistency
   */
  checkIndentation(lines) {
    const indents = lines
      .filter(l => l.length > 0 && l[0] === ' ')
      .map(l => l.match(/^ */)[0].length);

    if (indents.length === 0) return { consistent: true };

    const uniqueIndents = new Set(indents);
    return { 
      consistent: uniqueIndents.size <= 3,
      patterns: Array.from(uniqueIndents).sort()
    };
  }

  /**
   * Analyze bullet point quality and usage
   */
  analyzeBulletPoints(cvText) {
    let score = 70;
    const lines = cvText.split('\n');
    
    // Count bullet points
    const bulletLines = lines.filter(l => 
      l.match(/^[\s]*[•\-\*]\s+/) || l.match(/^[\s]*\d+\.\s+/)
    );
    
    const bulletRatio = bulletLines.length / lines.filter(l => l.trim().length > 0).length;

    // For a CV, 30-60% bullets is ideal
    if (bulletRatio < 0.2) score -= 15; // Not enough bullets
    if (bulletRatio > 0.8) score -= 10; // Too many bullets

    // Check bullet point quality
    let actionVerbCount = 0;
    let metricsCount = 0;
    let shortBulletCount = 0;

    bulletLines.forEach(line => {
      const text = line.toLowerCase();
      
      // Check for action verbs
      if (this.actionVerbs.some(verb => text.includes(verb))) {
        actionVerbCount++;
      }
      
      // Check for metrics/numbers
      if (text.match(/\d+[\s%\$\+]|million|thousand|billion/)) {
        metricsCount++;
      }
      
      // Check for short bullets (< 40 chars = weak)
      if (line.replace(/^[\s]*[•\-\*]\s+/, '').length < 40) {
        shortBulletCount++;
      }
    });

    // Score based on quality
    if (bulletLines.length > 0) {
      const verbRatio = actionVerbCount / bulletLines.length;
      const metricsRatio = metricsCount / bulletLines.length;
      const longBulletRatio = 1 - (shortBulletCount / bulletLines.length);

      score = Math.round(
        70 + 
        (Math.min(verbRatio, 1) * 15) +
        (Math.min(metricsRatio, 0.7) * 15)
      );
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze content density and balance
   */
  analyzeContentDensity(cvText) {
    let score = 80;
    const totalWords = cvText.split(/\s+/).length;
    const lines = cvText.split('\n').filter(l => l.trim().length > 0).length;
    
    // Calculate average words per line
    const avgWordsPerLine = totalWords / lines;

    // Ideal is 8-15 words per line for CV
    if (avgWordsPerLine < 5) score -= 15;
    if (avgWordsPerLine > 20) score -= 15;

    // Check total length (optimal: 300-800 words)
    if (totalWords < 200) score -= 20;
    if (totalWords > 1000) score -= 10;

    // Check for reasonable section sizes
    const sectionSizes = this.analyzeSectionSizes(cvText);
    if (sectionSizes.maxSectionRatio > 0.6) score -= 15; // One section dominates
    if (sectionSizes.minSectionRatio < 0.05) score -= 10; // One section too small

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze relative section sizes
   */
  analyzeSectionSizes(cvText) {
    const sections = cvText.split(/\n(?=[A-Z][A-Z\s]+\n)/);
    const sizes = sections.map(s => s.split(/\s+/).length);
    const totalWords = sizes.reduce((a, b) => a + b, 0);

    return {
      maxSectionRatio: Math.max(...sizes) / totalWords,
      minSectionRatio: Math.min(...sizes) / totalWords,
      avgSectionSize: totalWords / sections.length
    };
  }

  /**
   * Check if keywords are naturally integrated
   */
  analyzeKeywordNaturalness(cvText) {
    let score = 80;
    const lines = cvText.split('\n');

    // Check for keyword stuffing (same keyword repeated many times in same section)
    const words = cvText.toLowerCase().split(/\s+/);
    const wordFreq = {};

    words.forEach(word => {
      if (word.length > 5) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // If any word appears more than 8% of the time, it's likely stuffing
    const stuffedWords = Object.entries(wordFreq)
      .filter(([word, count]) => (count / words.length) > 0.08)
      .length;

    if (stuffedWords > 3) score -= 25;
    if (stuffedWords > 1) score -= 15;

    // Check for natural language patterns
    const hasProperSentences = cvText.match(/[a-z][.!?]\s+[A-Z]/g);
    if (!hasProperSentences || hasProperSentences.length === 0) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get actionable format recommendations
   */
  getFormatRecommendations(scores) {
    const recommendations = [];

    if (scores.sectionStructure < 70) {
      recommendations.push({
        category: 'structure',
        title: 'Improve CV structure',
        description: 'Add missing sections (Summary, Education, Skills). Use clear section headers.',
        priority: 'high'
      });
    }

    if (scores.formatting < 70) {
      recommendations.push({
        category: 'formatting',
        title: 'Fix formatting issues',
        description: 'Remove excessive blank lines, standardize indentation, and improve readability.',
        priority: 'high'
      });
    }

    if (scores.bulletQuality < 70) {
      recommendations.push({
        category: 'bullets',
        title: 'Strengthen bullet points',
        description: 'Start bullets with action verbs and include specific metrics/numbers.',
        priority: 'high'
      });
    }

    if (scores.contentDensity < 70) {
      recommendations.push({
        category: 'density',
        title: 'Balance content density',
        description: 'Adjust the amount of detail. CV should be 300-800 words on 1-2 pages.',
        priority: 'medium'
      });
    }

    if (scores.keywordNaturalness < 70) {
      recommendations.push({
        category: 'keywords',
        title: 'Avoid keyword stuffing',
        description: 'Integrate job keywords naturally. Overuse looks suspicious to recruiters.',
        priority: 'medium'
      });
    }

    return recommendations;
  }
}

module.exports = CVFormatAnalyzer;
