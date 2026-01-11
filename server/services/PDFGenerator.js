const { jsPDF } = require('jspdf');

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
    try {
      const doc = new jsPDF();
      let y = 30;
      
      // If cvData is a string (raw text), render it directly
      if (typeof cvData === 'string') {
        return this.generatePDFFromText(cvData);
      }
      
      // Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(cvData.name || 'Your Name', 20, y);
      y += 10;
      
      // Contact
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const contact = [cvData.phone, cvData.email, cvData.location].filter(Boolean).join(' | ');
      doc.text(contact, 20, y);
      y += 20;
      
      // Summary
      if (cvData.summary) {
        y = this.addSection(doc, 'PROFESSIONAL SUMMARY', cvData.summary, y);
      }
      
      // Experience
      if (cvData.experience && cvData.experience.length > 0) {
        y = this.addExperienceSection(doc, cvData.experience, y);
      }
      
      // Education
      if (cvData.education && cvData.education.length > 0) {
        y = this.addEducationSection(doc, cvData.education, y);
      }
      
      // Skills
      if (cvData.skills && cvData.skills.length > 0) {
        y = this.addSection(doc, 'SKILLS', cvData.skills.join(' • '), y);
      }
      
      return new Uint8Array(doc.output('arraybuffer'));
    } catch (error) {
      throw error;
    }
  }

  generatePDFFromText(cvText) {
    const doc = new jsPDF();
    let y = 30;
    const lines = cvText.split('\n');
    let currentSection = null;
    
    // Find first two non-empty lines (name and contact)
    let nameIndex = -1;
    let contactIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()) {
        if (nameIndex === -1) {
          nameIndex = i;
        } else if (contactIndex === -1) {
          contactIndex = i;
          break;
        }
      }
    }
    
    // Standard resume header - centered
    if (nameIndex >= 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      const nameWidth = doc.getTextWidth(lines[nameIndex].trim());
      const centerX = (210 - nameWidth) / 2;
      doc.text(lines[nameIndex].trim(), centerX, y);
      y += 8;
    }
    
    if (contactIndex >= 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const contactWidth = doc.getTextWidth(lines[contactIndex].trim());
      const centerX = (210 - contactWidth) / 2;
      doc.text(lines[contactIndex].trim(), centerX, y);
      y += 15;
    }
    
    // Process remaining content
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Skip header lines and empty lines
      if (!trimmed || index === nameIndex || index === contactIndex) {
        return;
      }
      
      // Section headers (ALL CAPS, bold)
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && trimmed.length < 50 && 
          !trimmed.includes('@') && !trimmed.includes('|') && !trimmed.includes('•')) {
        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(trimmed, 20, y);
        y += 4;
        // Add horizontal line under section
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);
        y += 10;
        currentSection = trimmed;
        return;
      }
      
      // Job titles and subheadings (bold)
      if (currentSection && !trimmed.startsWith('•') && !trimmed.startsWith('-') && 
          (trimmed.includes('|') || (trimmed.length > 10 && trimmed.length < 80))) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const wrappedLines = doc.splitTextToSize(trimmed, 170);
        doc.text(wrappedLines, 20, y);
        y += wrappedLines.length * 5 + 3;
        return;
      }
      
      // Regular content (normal weight)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const wrappedLines = doc.splitTextToSize(trimmed, 170);
      
      // Check for new page
      if (y + (wrappedLines.length * 5) > 280) {
        doc.addPage();
        y = 30;
      }
      
      doc.text(wrappedLines, 20, y);
      y += wrappedLines.length * 5 + 2;
    });
    
    return new Uint8Array(doc.output('arraybuffer'));
  }

  addSection(doc, title, content, y) {
    // Section header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, 20, y);
    y += 8;
    
    // Separator line (text-based for ATS)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('————————————————————————————————————————————————', 20, y);
    y += 8;
    
    // Content
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(content, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 15;
    
    return y;
  }

  addExperienceSection(doc, experiences, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('EXPERIENCE', 20, y);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('————————————————————————————————————————————————', 20, y);
    y += 12;
    
    experiences.forEach(exp => {
      // Job title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(exp.title || exp.position || 'Position', 20, y);
      y += 6;
      
      // Company and duration
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`${exp.company || 'Company'} • ${exp.duration || 'Duration'}`, 20, y);
      y += 8;
      
      // Responsibilities
      if (exp.responsibilities) {
        const bullets = Array.isArray(exp.responsibilities) 
          ? exp.responsibilities 
          : exp.responsibilities.split('\n').filter(line => line.trim());
        
        bullets.forEach(resp => {
          const clean = resp.replace(/^[•\-\*]\s*/, '');
          const lines = doc.splitTextToSize(`• ${clean}`, 160);
          doc.text(lines, 25, y);
          y += lines.length * 5;
        });
      }
      y += 8;
    });
    
    return y + 10;
  }

  addEducationSection(doc, education, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('EDUCATION', 20, y);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('————————————————————————————————————————————————', 20, y);
    y += 12;
    
    education.forEach(edu => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(edu.degree || 'Degree', 20, y);
      y += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`${edu.school || 'School'} • ${edu.year || 'Year'}`, 20, y);
      y += 10;
    });
    
    return y + 10;
  }

  parseTextCV(cvText) {
    const lines = cvText.split('\n').filter(line => line.trim());
    const cvData = {};

    // Extract name (first line)
    cvData.name = lines[0] || 'Your Name';

    // Extract contact info
    const emailMatch = cvText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const phoneMatch = cvText.match(/\+?\d{2,3}[-\s]?\d{3,4}[-\s]?\d{3,4}[-\s]?\d{3,4}/);
    const locationMatch = cvText.match(/([A-Za-z\s]+,\s*[A-Za-z\s]+)/);

    cvData.email = emailMatch ? emailMatch[0] : '';
    cvData.phone = phoneMatch ? phoneMatch[0] : '';
    cvData.location = locationMatch ? locationMatch[0] : '';

    // Extract sections
    const sections = this.extractSections(cvText);
    
    cvData.summary = sections['professional summary'] || sections.summary || '';
    cvData.skills = this.parseSkills(sections.skills || '');
    cvData.experience = this.parseExperience(sections.experience || sections['work experience'] || '');
    cvData.education = this.parseEducation(sections.education || '');

    return cvData;
  }

  extractSections(cvText) {
    const sections = {};
    const sectionHeaders = [
      'professional summary', 'summary', 'objective',
      'experience', 'work experience', 'employment', 'career history',
      'education', 'academic background',
      'skills', 'technical skills', 'core skills', 'competencies',
      'projects', 'certifications'
    ];
    let currentSection = null;
    let currentContent = [];

    cvText.split('\n').forEach(line => {
      const trimmedLine = line.trim().toLowerCase();
      
      // Check if line is a section header (all caps or matches header list)
      const isAllCaps = line.trim() === line.trim().toUpperCase() && line.trim().length > 2;
      const matchedHeader = sectionHeaders.find(header => 
        trimmedLine === header || trimmedLine.includes(header)
      );

      if ((isAllCaps && line.trim().length < 50) || matchedHeader) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        currentSection = matchedHeader || trimmedLine;
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

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check if this line looks like a job title/company line
      if (trimmed && !trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
        // If we have a current experience, save it
        if (currentExp) {
          currentExp.responsibilities = responsibilities;
          experiences.push(currentExp);
        }
        
        // Check if line contains company and duration info (with |)
        if (trimmed.includes('|')) {
          const parts = trimmed.split('|').map(p => p.trim());
          currentExp = {
            title: parts[0] || 'Position',
            company: parts[1] || 'Company',
            duration: parts[2] || 'Duration'
          };
        } else if (index + 1 < lines.length && lines[index + 1].includes('•')) {
          // Next line has bullets, so this is likely a job title
          currentExp = {
            title: trimmed,
            company: 'Company',
            duration: 'Duration'
          };
        } else {
          // Single line job entry
          currentExp = {
            title: trimmed,
            company: 'Company', 
            duration: 'Duration'
          };
        }
        responsibilities = [];
      } else if (currentExp && (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*'))) {
        // This is a responsibility bullet
        responsibilities.push(trimmed.replace(/^[•\-\*]\s*/, ''));
      } else if (currentExp && trimmed && !trimmed.match(/^[A-Z\s]+$/)) {
        // Non-bullet content that's not a section header
        responsibilities.push(trimmed);
      }
    });

    // Save the last experience
    if (currentExp) {
      currentExp.responsibilities = responsibilities;
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
          year: line.match(/\d{4}/) ? line.match(/\d{4}/)[0] : ''
        });
      }
    });

    return education;
  }

  parseSkills(skillsText) {
    if (!skillsText) return [];
    return skillsText.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .filter(skill => skill);
  }
}

module.exports = PDFGenerator;