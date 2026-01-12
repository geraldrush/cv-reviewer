const OpenAI = require('openai');

class CVRewriter {
  constructor(openaiApiKey) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  safeTruncateCV(text, maxChars = 3000) {
    const sections = text.split(/(PROFESSIONAL SUMMARY|EXPERIENCE|EDUCATION|SKILLS)/i);
    let result = '';
    for (const part of sections) {
      if ((result + part).length > maxChars) break;
      result += part;
    }
    return result;
  }

  async rewriteEntireCV(cvText, jobDescription, analysis) {
    try {
      const missingKeywords = analysis?.atsAnalysis?.keywordMatch?.mandatory?.missing?.slice(0, 8) || [];
      const truncatedCV = this.safeTruncateCV(cvText);
      const truncatedJob = jobDescription.substring(0, 1000);
      
      const prompt = `You are an expert ATS + recruiter CV writer.

Rewrite the CV below to improve both ATS parsing and recruiter appeal.

IMPORTANT: Always start with the applicant's name and contact information at the top.

TARGET ROLE:
${analysis?.targetRole || "Not specified"}

JOB DESCRIPTION:
${truncatedJob}

KEY SKILLS TO INCORPORATE NATURALLY:
${missingKeywords.join(', ')}

RULES:
- ALWAYS include name and contact info at the very top
- Contact info (phone and email) must be directly below the name
- Use ATS-standard headers only
- No tables, no icons, no graphics
- Use achievement-based bullets where possible
- Include metrics where realistic
- Do NOT keyword-stuff
- Keep language professional and concise

REQUIRED FORMAT:
[FULL NAME]
[Phone Number] | [Email Address] | [Location]

PROFESSIONAL SUMMARY
[Summary content]

WORK EXPERIENCE
[Experience content]

EDUCATION
[Education content]

TECHNICAL SKILLS
[Skills content]

ORIGINAL CV:
${truncatedCV}

Return ONLY the rewritten CV text with name on first line and contact info on second line.`;

      console.log('🔗 Calling OpenAI API for CV rewrite...');
      console.log('🔑 API Key check: ', this.openai ? 'initialized' : 'NOT INITIALIZED');
      
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2200,
          temperature: 0.3
        });

        console.log('✅ OpenAI response received');
        const output = response.choices[0].message.content.trim();
        
        if (!output.includes("WORK EXPERIENCE") && !output.includes("EXPERIENCE")) {
          throw new Error("Invalid CV rewrite output - missing required sections");
        }

        return output;
      } catch (apiError) {
        console.error('❌ OpenAI API Error:', apiError.message);
        console.error('❌ Error code:', apiError.code);
        console.error('❌ Error status:', apiError.status);
        console.error('❌ Error details:', apiError);
        throw new Error(`OpenAI API failed: ${apiError.message || apiError.code || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ CV rewrite error:', error.message || error);
      console.error('Error details:', error);
      const errorMsg = error.message || error.toString();
      throw new Error(`Failed to rewrite CV: ${errorMsg}`);
    }
  }

  async rewriteSection(sectionText, sectionType, jobDescription) {
    try {
      const prompts = {
        experience: `Rewrite this experience section to be more impactful:
${sectionText}

Job requirements: ${jobDescription.substring(0, 300)}...

Rewrite task-based bullets into achievement-oriented bullets where possible.`,
        
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
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompts[sectionType] || prompts.experience }],
        max_tokens: 500,
        temperature: 0.3
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Section rewrite error:', error);
      return sectionText;
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

  convertToMarkdown(cvText) {
    return cvText
      .replace(/^([A-Z\s]+)$/gm, '# $1')  // Section headers
      .replace(/^•\s/gm, '- ')            // Bullet points
      .replace(/^([A-Za-z][^\n]*\|[^\n]*)$/gm, '**$1**'); // Job titles with pipes
  }

  async applyUserImprovements(originalCV, improvements, jobDescription) {
    try {
      const prompt = `Improve this CV by applying the user's specific improvements:

ORIGINAL CV:
${this.safeTruncateCV(originalCV)}

USER IMPROVEMENTS:
${Object.entries(improvements).map(([key, value]) => `${key}: ${value}`).join('\n')}

JOB REQUIREMENTS:
${jobDescription.substring(0, 500)}

Naturally incorporate the following skills where they logically apply:
1. Add missing keywords naturally throughout the CV
2. Rewrite task-based bullets into achievement-oriented bullets where possible
3. Use strong action verbs (Led, Built, Delivered, Achieved)
4. Include specific metrics where realistic
5. Optimize section headers for ATS parsing
6. Ensure contact info is complete and properly formatted
7. Add relevant technical skills
8. Structure for F-pattern scanning (most important info first)

Return the improved CV:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3
      });

      const output = response.choices[0].message.content.trim();
      
      if (!output.includes("EXPERIENCE") && !output.includes("WORK EXPERIENCE")) {
        throw new Error("Invalid improvement output - missing required sections");
      }

      return output;
    } catch (error) {
      console.error('Apply improvements error:', error);
      throw new Error('Failed to apply improvements');
    }
  }
}

module.exports = CVRewriter;