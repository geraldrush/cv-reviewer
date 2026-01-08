const OpenAI = require('openai');

class CVRewriter {
  constructor(openaiApiKey) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  async rewriteEntireCV(cvText, jobDescription, analysis) {
    try {
      const missingKeywords = analysis.atsAnalysis?.keywordMatch?.mandatory?.missing?.slice(0, 10) || [];
      const truncatedCV = cvText.length > 2500 ? cvText.substring(0, 2500) : cvText;
      const truncatedJob = jobDescription.length > 800 ? jobDescription.substring(0, 800) : jobDescription;
      
      const prompt = `Rewrite this CV to achieve 85%+ analysis score by including these EXACT keywords and improvements:

MISSING KEYWORDS (MUST INCLUDE): ${missingKeywords.join(', ')}

JOB REQUIREMENTS: ${truncatedJob}

ORIGINAL CV:
${truncatedCV}

CRITICAL IMPROVEMENTS NEEDED:
1. Add these exact keywords: ${missingKeywords.join(', ')}
2. Replace ALL "responsible for" with "Led", "Built", "Delivered", "Achieved"
3. Add specific metrics to EVERY bullet (percentages, numbers, timeframes)
4. Start with strong professional summary containing target role keywords
5. Use ATS-friendly section headers: PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, TECHNICAL SKILLS
6. Include complete contact info in header
7. Structure bullets as: [Action Verb] + [What] + [Result with metric]
8. Add relevant technical skills from job requirements

Example bullet format:
• Led team of 5 developers, delivering 3 projects 20% ahead of schedule
• Built responsive web application serving 10,000+ users with 99.9% uptime
• Reduced API response time by 40% through database optimization

Return the optimized CV that will score 85%+ on analysis:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.1
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('CV rewrite error:', error);
      throw new Error('Failed to rewrite CV');
    }
  }

  async rewriteSection(sectionText, sectionType, jobDescription) {
    try {
      const prompts = {
        experience: `Rewrite this experience section to be more impactful:
${sectionText}

Job requirements: ${jobDescription.substring(0, 300)}...

Make bullets achievement-focused with metrics and strong verbs.`,
        
        skills: `Optimize this skills section for ATS and relevance:
${sectionText}

Job requirements: ${jobDescription.substring(0, 300)}...

Prioritize relevant skills and add missing ones if applicable.`,
        
        summary: `Rewrite this professional summary for maximum impact:
${sectionText}

Job requirements: ${jobDescription.substring(0, 300)}...

Make it compelling for both ATS and recruiters.`
      };

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompts[sectionType] || prompts.experience }],
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Section rewrite error:', error);
      return sectionText; // Return original if rewrite fails
    }
  }

  generateImprovedCV(originalCV, analysis, jobDescription) {
    const improvements = {
      original: originalCV,
      rewritten: null,
      improvements: [],
      downloadReady: false
    };

    // Add specific improvements based on analysis
    if (analysis.atsAnalysis?.keywordMatch?.mandatory?.missing?.length > 0) {
      improvements.improvements.push({
        type: 'keywords',
        description: `Add missing keywords: ${analysis.atsAnalysis.keywordMatch.mandatory.missing.slice(0, 5).join(', ')}`,
        priority: 'critical'
      });
    }

    if (analysis.intelligenceAnalysis?.bullets?.bulletAnalysis) {
      const weakBullets = analysis.intelligenceAnalysis.bullets.bulletAnalysis.filter(b => b.score < 60);
      if (weakBullets.length > 0) {
        improvements.improvements.push({
          type: 'bullets',
          description: `Rewrite ${weakBullets.length} weak bullet points with metrics and impact`,
          priority: 'high'
        });
      }
    }

    if (analysis.recruiterAnalysis?.firstImpressionScore < 70) {
      improvements.improvements.push({
        type: 'header',
        description: 'Strengthen opening section for better first impression',
        priority: 'high'
      });
    }

    return improvements;
  }

  formatForDownload(cvText, format = 'txt') {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'txt':
        return {
          content: cvText,
          filename: `improved_cv_${timestamp}.txt`,
          mimeType: 'text/plain'
        };
      
      case 'md':
        const markdownCV = this.convertToMarkdown(cvText);
        return {
          content: markdownCV,
          filename: `improved_cv_${timestamp}.md`,
          mimeType: 'text/markdown'
        };
      
      default:
        return {
          content: cvText,
          filename: `improved_cv_${timestamp}.txt`,
          mimeType: 'text/plain'
        };
    }
  }

  async applyUserImprovements(originalCV, improvements, jobDescription) {
    try {
      const prompt = `Improve this CV by applying the user's specific improvements and ensure it scores higher:

ORIGINAL CV:
${originalCV.substring(0, 2000)}

USER IMPROVEMENTS:
${Object.entries(improvements).map(([key, value]) => `${key}: ${value}`).join('\n')}

JOB REQUIREMENTS:
${jobDescription.substring(0, 500)}

Apply improvements to MAXIMIZE ATS and recruiter scores:
1. Add ALL missing keywords naturally throughout the CV
2. Replace weak bullets with quantified achievements
3. Use strong action verbs (Led, Built, Delivered, Achieved)
4. Include specific metrics and percentages
5. Optimize section headers for ATS parsing
6. Ensure contact info is complete and properly formatted
7. Add relevant technical skills
8. Structure for F-pattern scanning (most important info first)

Return the significantly improved CV that will score 80%+ on analysis:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.2
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Apply improvements error:', error);
      throw new Error('Failed to apply improvements');
    }
  }
}

module.exports = CVRewriter;