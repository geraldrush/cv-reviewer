const PDFDocument = require('pdfkit');

class PDFGenerator {
  constructor() {
    this.atsOptimizedStyles = {
      font: 'Helvetica',
      fontSize: {
        name: 16,
        section: 14,
        content: 11,
        contact: 10
      },
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      },
      spacing: {
        section: 20,
        paragraph: 12,
        line: 14
      }
    };
  }

  generateATSOptimizedPDF(cvData, filename = 'optimized_cv.pdf') {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,    // Slightly tighter for more content
            bottom: 50,
            left: 50,
            right: 50
          },
          info: {
            Title: 'Professional CV - ATS Optimized',
            Author: cvData.name || 'CV Reviewer',
            Subject: 'Beautiful Professional Resume',
            Keywords: 'CV, Resume, Professional, ATS-Optimized'
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Header with name and contact
        this.addATSHeader(doc, cvData);
        
        // Professional Summary
        if (cvData.summary && cvData.summary.trim()) {
            this.addATSSection(doc, 'PROFESSIONAL SUMMARY', cvData.summary);
        }
        
        // Core Skills / Technical Skills
        if (cvData.skills && (Array.isArray(cvData.skills) ? cvData.skills.length > 0 : cvData.skills.trim())) {
            this.addATSSection(doc, 'CORE SKILLS', cvData.skills);
        }
        
        // Work Experience
        if (cvData.experience && cvData.experience.length > 0) {
            this.addATSExperienceSection(doc, cvData.experience);
        }
        
        // Projects Section
        if (cvData.projects && cvData.projects.length > 0) {
            this.addATSProjectsSection(doc, cvData.projects);
        }
        
        // Education
        if (cvData.education && cvData.education.length > 0) {
            this.addATSEducationSection(doc, cvData.education);
        }
        
        // Certifications
        if (cvData.certifications && cvData.certifications.trim()) {
            this.addATSSection(doc, 'CERTIFICATIONS', cvData.certifications);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  addATSHeader(doc, cvData) {
    // Name (24pt, largest text on page, no icons for ATS)
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .fillColor('#000000')
       .text(cvData.name || 'FULL NAME', { align: 'left' });
    
    doc.moveDown(0.2);
    
    // Simple line under name
    doc.strokeColor('#000000')
       .lineWidth(1)
       .moveTo(54, doc.y)
       .lineTo(200, doc.y)
       .stroke();
    
    doc.moveDown(0.4);
    
    // Contact info (only show real data, no placeholders)
    const contactInfo = [
      cvData.phone,
      cvData.email,
      cvData.linkedin,
      cvData.github,
      cvData.location
    ].filter(info => info && 
      !info.includes('555-123') && 
      !info.includes('example.com') && 
      !info.includes('yourname') && 
      !info.includes('yourusername') &&
      !info.includes('City, Country')
    );
    
    if (contactInfo.length > 0) {
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#000000');
      
      // Display contact info in clean format
      contactInfo.forEach((info, index) => {
        if (index % 2 === 0) {
          doc.text(info, 54, doc.y, { continued: true });
          if (contactInfo[index + 1]) {
            doc.text(`    ${contactInfo[index + 1]}`);
          } else {
            doc.text('');
          }
        }
      });
    }
    
    doc.moveDown(1.5);
  }

  addATSSection(doc, title, content) {
    // Section heading
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor('#000000')
       .text(title.toUpperCase(), { align: 'left' });
    
    // Simple line under section
    doc.strokeColor('#000000')
       .lineWidth(0.5)
       .moveTo(54, doc.y + 5)
       .lineTo(541, doc.y + 5)
       .stroke();
    
    doc.moveDown(0.8);
    
    // Content
    if (Array.isArray(content)) {
      content.forEach((skill, index) => {
        doc.font('Helvetica')
           .fontSize(11)
           .fillColor('#000000')
           .text(`• ${skill}`, { 
             align: 'left',
             indent: 10
           });
      });
    } else {
      doc.font('Helvetica')
         .fontSize(11)
         .fillColor('#000000')
         .text(content, { 
           align: 'left', 
           lineGap: 3,
           indent: 10
         });
    }
    
    doc.moveDown(1.8);
  }

  addATSExperienceSection(doc, experiences) {
    // Section heading
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor('#000000')
       .text('EXPERIENCE', { align: 'left' });
    
    // Simple line
    doc.strokeColor('#000000')
       .lineWidth(0.5)
       .moveTo(54, doc.y + 5)
       .lineTo(541, doc.y + 5)
       .stroke();
    
    doc.moveDown(0.8);

    experiences.forEach((exp, index) => {
      // Job title
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor('#000000')
         .text(exp.title || exp.position || 'Position Title', { align: 'left' });
      
      // Company and duration
      const companyLine = `${exp.company || 'Company'} • ${exp.duration || 'Duration'}`;
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#000000')
         .text(companyLine, { align: 'left' });
      
      doc.moveDown(0.3);
      
      // Responsibilities
      if (exp.responsibilities) {
        const bullets = Array.isArray(exp.responsibilities) 
          ? exp.responsibilities 
          : exp.responsibilities.split('\n').filter(line => line.trim());
        
        bullets.forEach(resp => {
          const cleanResp = resp.replace(/^[•\-\*]\s*/, '');
          doc.font('Helvetica')
             .fontSize(11)
             .fillColor('#000000')
             .text(`• ${cleanResp}`, { 
               align: 'left',
               indent: 15,
               lineGap: 2
             });
        });
      }
      
      if (index < experiences.length - 1) {
        doc.moveDown(1.5);
      }
    });
    
    doc.moveDown(2);
  }

  addATSEducationSection(doc, education) {
    // Section heading
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor('#000000')
       .text('EDUCATION', { align: 'left' });
    
    // Simple line
    doc.strokeColor('#000000')
       .lineWidth(0.5)
       .moveTo(54, doc.y + 5)
       .lineTo(541, doc.y + 5)
       .stroke();
    
    doc.moveDown(0.8);

    education.forEach((edu, index) => {
      // Degree
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor('#000000')
         .text(edu.degree || 'Degree', { align: 'left' });
      
      // School and year
      const schoolLine = `${edu.school || 'School'} • ${edu.year || 'Year'}`;
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('#000000')
         .text(schoolLine, { align: 'left' });
      
      if (index < education.length - 1) {
        doc.moveDown(1);
      }
    });
    
    doc.moveDown(2);
  }

  // Convert plain text CV to structured data
  parseTextCV(cvText) {
    const lines = cvText.split('\n').filter(line => line.trim());
    const cvData = {};

    // Extract name (first line, all caps)
    cvData.name = lines[0] && lines[0].trim().toUpperCase() === lines[0].trim() ? lines[0].trim() : 'Your Name';

    // Extract contact info with better patterns
    const emailMatch = cvText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const phoneMatch = cvText.match(/\+?\d{2,3}[-\s]?\d{3,4}[-\s]?\d{3,4}[-\s]?\d{3,4}/);
    const linkedinMatch = cvText.match(/linkedin\.com\/in\/[^\s]+/);
    const githubMatch = cvText.match(/github\.com\/[^\s]+/);
    const locationMatch = cvText.match(/([A-Za-z\s]+,\s*[A-Za-z\s]+)/);

    cvData.email = emailMatch && !emailMatch[0].includes('example.com') ? emailMatch[0] : '';
    cvData.phone = phoneMatch && !phoneMatch[0].includes('123-456') && !phoneMatch[0].includes('555-') ? phoneMatch[0] : '';
    cvData.linkedin = linkedinMatch && !linkedinMatch[0].includes('yourname') ? linkedinMatch[0] : '';
    cvData.github = githubMatch && !githubMatch[0].includes('yourusername') && !githubMatch[0].includes('username') ? githubMatch[0] : '';
    cvData.location = locationMatch ? locationMatch[0] : '';

    // Extract sections
    const sections = this.extractSections(cvText);
    
    cvData.summary = sections['professional summary'] || sections.summary || sections.objective || '';
    cvData.skills = this.parseSkills(sections['core skills'] || sections.skills || sections['technical skills'] || '');
    cvData.certifications = sections.certifications || '';
    cvData.experience = this.parseExperience(sections['work experience'] || sections.experience || '');
    cvData.education = this.parseEducation(sections.education || '');
    cvData.projects = this.parseProjects(sections.projects || '');

    return cvData;
  }

  extractSections(cvText) {
    const sections = {};
    const sectionHeaders = [
      'professional summary', 'summary', 'objective', 'experience', 'work experience', 'employment',
      'education', 'skills', 'technical skills', 'core skills', 'certifications', 'projects'
    ];

    let currentSection = null;
    let currentContent = [];

    cvText.split('\n').forEach(line => {
      const trimmedLine = line.trim().toLowerCase();
      
      // Check if line is a section header
      const matchedHeader = sectionHeaders.find(header => 
        (trimmedLine.includes(header) || trimmedLine === header) && line.trim().length < 50
      );

      if (matchedHeader) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        currentSection = matchedHeader;
        currentContent = [];
      } else if (currentSection && line.trim()) {
        currentContent.push(line);
      }
    });

    // Save last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  parseExperience(experienceText) {
    if (!experienceText) return [];

    const experiences = [];
    const lines = experienceText.split('\n').filter(line => line.trim());
    
    let currentExp = null;
    let responsibilities = [];

    lines.forEach(line => {
      // Check if line contains dates (likely a job entry)
      if (/\d{4}/.test(line) && (line.includes('-') || line.includes('to') || line.includes('present'))) {
        // Save previous experience
        if (currentExp) {
          currentExp.responsibilities = responsibilities.join('\n');
          experiences.push(currentExp);
        }

        // Start new experience
        const parts = line.split('|').map(p => p.trim());
        currentExp = {
          position: parts[0] || 'Position',
          company: parts[1] || 'Company',
          duration: parts[2] || line.match(/\d{4}.*/) ? line.match(/\d{4}.*/)[0] : ''
        };
        responsibilities = [];
      } else if (currentExp && line.trim()) {
        responsibilities.push(line);
      }
    });

    // Save last experience
    if (currentExp) {
      currentExp.responsibilities = responsibilities.join('\n');
      experiences.push(currentExp);
    }

    return experiences;
  }

  parseEducation(educationText) {
    if (!educationText) return [];

    const education = [];
    const lines = educationText.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.includes('|') || /\d{4}/.test(line)) {
        const parts = line.split('|').map(p => p.trim());
        education.push({
          degree: parts[0] || line,
          school: parts[1] || '',
          year: line.match(/\d{4}/) ? line.match(/\d{4}/)[0] : '',
          gpa: line.match(/gpa:?\s*[\d.]+/i) ? line.match(/gpa:?\s*([\d.]+)/i)[1] : ''
        });
      }
    });

    return education;
  }

  addATSProjectsSection(doc, projects) {
    // Section heading
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor('#000000')
       .text('PROJECTS', { align: 'left' });
    
    // Simple line
    doc.strokeColor('#000000')
       .lineWidth(0.5)
       .moveTo(54, doc.y + 5)
       .lineTo(541, doc.y + 5)
       .stroke();
    
    doc.moveDown(0.8);

    projects.forEach((project, index) => {
      // Project name with tech stack
      const projectTitle = `${project.name || 'Project Name'} | ${project.techStack || 'Tech Stack'}`;
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor('#000000')
         .text(projectTitle, { align: 'left' });
      
      // Link if available
      if (project.link) {
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#000000')
           .text(project.link, { align: 'left' });
      }
      
      doc.moveDown(0.3);
      
      // Project description
      if (project.description) {
        doc.font('Helvetica')
           .fontSize(11)
           .fillColor('#000000')
           .text(project.description, { 
             align: 'left',
             indent: 15
           });
      }
      
      // Project achievements
      if (project.achievements) {
        const achievements = Array.isArray(project.achievements) 
          ? project.achievements 
          : project.achievements.split('\n').filter(line => line.trim());
        
        achievements.forEach(achievement => {
          doc.font('Helvetica')
             .fontSize(11)
             .fillColor('#000000')
             .text(`• ${achievement}`, { 
               align: 'left',
               indent: 15,
               lineGap: 2
             });
        });
      }
      
      if (index < projects.length - 1) {
        doc.moveDown(1.5);
      }
    });
    
    doc.moveDown(2);
  }

  parseSkills(skillsText) {
    if (!skillsText) return [];
    
    const lines = skillsText.split('\n').filter(line => line.trim());
    const skills = [];
    
    lines.forEach(line => {
      const cleanLine = line.replace(/^[-•]\s*/, '').trim();
      if (cleanLine && 
          !cleanLine.toLowerCase().includes('placeholder') &&
          !cleanLine.toLowerCase().includes('contact info') &&
          !cleanLine.toLowerCase().includes('email:') &&
          !cleanLine.toLowerCase().includes('phone:')) {
        skills.push(cleanLine);
      }
    });
    
    return skills;
  }

  parseProjects(projectsText) {
    if (!projectsText) return [];
    
    const projects = [];
    const lines = projectsText.split('\n').filter(line => line.trim());
    
    let currentProject = null;
    let achievements = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.includes('|') && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
        if (currentProject) {
          currentProject.achievements = achievements;
          projects.push(currentProject);
        }
        
        const parts = trimmed.split('|');
        currentProject = {
          name: parts[0].trim(),
          techStack: parts[1] ? parts[1].trim() : '',
          link: '',
          description: '',
          achievements: []
        };
        achievements = [];
      }
      else if (trimmed.includes('github.com') && !trimmed.includes('yourusername')) {
        if (currentProject) currentProject.link = trimmed;
      }
      else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const achievement = trimmed.replace(/^[•-]\s*/, '');
        if (achievement && !achievement.toLowerCase().includes('placeholder')) {
          achievements.push(achievement);
        }
      }
      else if (currentProject && trimmed && !trimmed.toLowerCase().includes('built an ats-compliant')) {
        if (!currentProject.description) {
          currentProject.description = trimmed;
        }
      }
    });
    
    if (currentProject) {
      currentProject.achievements = achievements;
      projects.push(currentProject);
    }
    
    return projects;
  }
}

module.exports = PDFGenerator;