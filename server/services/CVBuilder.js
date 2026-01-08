const OpenAI = require('openai');

class CVBuilder {
  constructor(openaiApiKey) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  getQuestions() {
    return [
      {
        id: 'personal',
        title: 'Personal Information',
        questions: [
          { key: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g., John Smith' },
          { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'e.g., john.smith@email.com' },
          { key: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: 'e.g., (555) 123-4567' },
          { key: 'location', label: 'Location (City, State)', type: 'text', required: true, placeholder: 'e.g., New York, NY' },
          { key: 'linkedin', label: 'LinkedIn URL', type: 'url', required: false, placeholder: 'e.g., linkedin.com/in/johnsmith' },
          { key: 'portfolio', label: 'Portfolio/Website', type: 'url', required: false, placeholder: 'e.g., johnsmith.dev or github.com/johnsmith' }
        ]
      },
      {
        id: 'target',
        title: 'Target Role',
        questions: [
          { key: 'targetRole', label: 'What job are you applying for?', type: 'text', required: true, placeholder: 'e.g., Frontend Developer, Data Analyst, Marketing Manager' },
          { key: 'industry', label: 'Industry', type: 'text', required: true, placeholder: 'e.g., Technology, Healthcare, Finance, E-commerce' },
          { key: 'experience', label: 'Years of experience (include self-taught)', type: 'number', required: true, placeholder: 'e.g., 2 (include personal projects and learning time)' }
        ]
      },
      {
        id: 'summary',
        title: 'Professional Summary',
        questions: [
          { key: 'keySkills', label: 'Top 5 skills (comma separated)', type: 'textarea', required: true, placeholder: 'e.g., JavaScript, React, Node.js, MongoDB, Git' },
          { key: 'achievements', label: 'Key achievements or accomplishments', type: 'textarea', required: true, placeholder: 'e.g., Built 3 full-stack web applications, Completed 50+ coding challenges, Contributed to open source projects' },
          { key: 'careerGoal', label: 'Career objective', type: 'textarea', required: false, placeholder: 'e.g., Seeking to leverage my self-taught programming skills and passion for technology to contribute to innovative web development projects' }
        ]
      },
      {
        id: 'experience',
        title: 'Work Experience',
        questions: [
          { key: 'jobs', label: 'Work Experience (include freelance, projects)', type: 'array', required: false, fields: [
            { key: 'company', label: 'Company/Project', type: 'text', placeholder: 'e.g., ABC Corp, Personal Project, Freelance Client' },
            { key: 'position', label: 'Job Title/Role', type: 'text', placeholder: 'e.g., Junior Developer, Full-Stack Developer, Project Creator' },
            { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g., Jan 2020 - Present, 3 months, Ongoing' },
            { key: 'responsibilities', label: 'Key responsibilities and achievements', type: 'textarea', placeholder: 'e.g., Built responsive web applications using React and Node.js\nImplemented user authentication and database integration\nDeployed applications to cloud platforms' }
          ]}
        ]
      },
      {
        id: 'education',
        title: 'Education & Learning',
        questions: [
          { key: 'education', label: 'Education & Self-Learning', type: 'array', required: false, fields: [
            { key: 'degree', label: 'Degree/Course/Certification', type: 'text', placeholder: 'e.g., Bachelor of Science, Self-taught Web Development, Google Analytics Certified' },
            { key: 'school', label: 'Institution/Platform', type: 'text', placeholder: 'e.g., University of XYZ, Coursera, YouTube, FreeCodeCamp' },
            { key: 'year', label: 'Year Completed', type: 'text', placeholder: 'e.g., 2020, 2019-2021, Ongoing' },
            { key: 'gpa', label: 'GPA/Achievement (optional)', type: 'text', placeholder: 'e.g., 3.8/4.0, Certificate of Completion' }
          ]}
        ]
      },
      {
        id: 'skills',
        title: 'Skills & Certifications',
        questions: [
          { key: 'technicalSkills', label: 'Technical Skills', type: 'textarea', required: true, placeholder: 'e.g., Programming: JavaScript, Python, HTML/CSS\nFrameworks: React, Express.js, Bootstrap\nDatabases: MongoDB, MySQL\nTools: Git, VS Code, Figma' },
          { key: 'certifications', label: 'Certifications & Courses', type: 'textarea', required: false, placeholder: 'e.g., FreeCodeCamp Responsive Web Design Certificate\nGoogle Analytics Individual Qualification\nUdemy Complete Web Developer Course' },
          { key: 'languages', label: 'Languages', type: 'textarea', required: false, placeholder: 'e.g., English (Native), Spanish (Conversational), French (Basic)' }
        ]
      }
    ];
  }

  async generateCV(responses, jobDescription = '') {
    try {
      console.log('generateCV called with responses:', Object.keys(responses));
      console.log('jobDescription length:', jobDescription.length);
      
      // Generate structured CV data directly
      const cvData = {
        name: responses.fullName,
        email: responses.email,
        phone: responses.phone,
        location: responses.location,
        linkedin: responses.linkedin,
        portfolio: responses.portfolio,
        summary: await this.generateSummary(responses, jobDescription),
        skills: this.parseSkills(responses.technicalSkills),
        experience: this.structureExperience(responses.jobs),
        education: Array.isArray(responses.education) ? responses.education : [],
        certifications: responses.certifications || ''
      };

      console.log('CV data generated successfully');
      
      // Generate text version for display
      const textCV = this.formatCVText(cvData);
      
      return {
        structured: cvData,
        text: textCV
      };
    } catch (error) {
      console.error('CV generation error details:', error.stack);
      throw new Error('Failed to generate CV: ' + error.message);
    }
  }

  async generateSummary(responses, jobDescription) {
    const keywords = this.extractKeywords(jobDescription);
    const prompt = `Write a 2-3 line professional summary for:
Role: ${responses.targetRole}
Experience: ${responses.experience} years
Skills: ${responses.keySkills}
Achievements: ${responses.achievements}
Keywords to include: ${keywords.slice(0, 5).join(', ')}

Format: Strong action verbs + quantified results + relevant keywords.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.3
    });

    return response.choices[0].message.content.trim();
  }

  parseSkills(skillsText) {
    if (!skillsText) return [];
    return skillsText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  structureExperience(jobs) {
    if (!jobs || !Array.isArray(jobs)) {
      return [];
    }
    return jobs.map(job => ({
      title: job.position,
      company: job.company,
      duration: job.duration,
      responsibilities: job.responsibilities ? 
        job.responsibilities.split('\n').filter(r => r.trim()) : []
    }));
  }

  extractKeywords(jobDescription) {
    if (!jobDescription) return [];
    const techTerms = jobDescription.match(/\b(?:JavaScript|React|Node|Python|AWS|Docker|SQL|Git)\b/gi) || [];
    return [...new Set(techTerms.map(term => term.toLowerCase()))];
  }

  formatCVText(cvData) {
    const sections = [];
    
    // Header
    sections.push(cvData.name.toUpperCase());
    const contact = [cvData.phone, cvData.email, cvData.linkedin, cvData.portfolio, cvData.location]
      .filter(Boolean).join(' | ');
    sections.push(contact);
    sections.push('');
    
    // Professional Summary
    sections.push('PROFESSIONAL SUMMARY');
    if (cvData.summary) {
      sections.push(cvData.summary);
    } else {
      sections.push('Professional summary will be added here.');
    }
    sections.push('');
    
    // Core Skills
    sections.push('CORE SKILLS');
    if (cvData.skills.length > 0) {
      cvData.skills.forEach(skill => sections.push(`• ${skill}`));
    } else {
      sections.push('• Technical skills will be listed here');
    }
    sections.push('');
    
    // Work Experience
    sections.push('WORK EXPERIENCE');
    if (cvData.experience.length > 0) {
      cvData.experience.forEach(exp => {
        sections.push(`${exp.title}`);
        sections.push(`${exp.company} • ${exp.duration}`);
        exp.responsibilities.forEach(resp => sections.push(`• ${resp}`));
        sections.push('');
      });
    } else {
      sections.push('Work experience will be added here.');
      sections.push('');
    }
    
    // Projects
    sections.push('PROJECTS');
    sections.push('Key projects will be listed here.');
    sections.push('');
    
    // Education
    sections.push('EDUCATION');
    if (cvData.education && Array.isArray(cvData.education) && cvData.education.length > 0) {
      cvData.education.forEach(edu => {
        sections.push(`${edu.degree}`);
        sections.push(`${edu.school} • ${edu.year}`);
      });
    } else {
      sections.push('Education details will be added here.');
    }
    sections.push('');
    
    // Certifications
    sections.push('CERTIFICATIONS');
    if (cvData.certifications) {
      cvData.certifications.split('\n').forEach(cert => {
        if (cert.trim()) sections.push(`• ${cert.trim()}`);
      });
    } else {
      sections.push('• Relevant certifications will be listed here');
    }
    
    return sections.join('\n');
  }

  validateResponses(responses) {
    const required = ['fullName', 'email', 'phone', 'location', 'targetRole', 'keySkills'];
    const missing = required.filter(field => !responses[field] || responses[field].trim() === '');
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return true;
  }
}

module.exports = CVBuilder;