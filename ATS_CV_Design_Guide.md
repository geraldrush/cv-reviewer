# ATS-Compliant CV Design Guide

## VISUAL LAYOUT (Top to Bottom)

```
[0.75" margin]
JOHN SMITH                                    [22pt, Helvetica-Bold]
john.smith@email.com | (555) 123-4567 | linkedin.com/in/johnsmith | github.com/johnsmith
                                              [11pt, Helvetica, single line]

PROFESSIONAL SUMMARY                          [14pt, Helvetica-Bold, ALL CAPS]
Results-driven software engineer with 5+ years of experience developing scalable web applications. 
Proven track record of delivering high-quality solutions using React, Node.js, and cloud technologies.
                                              [11pt, Helvetica, 1.15 line spacing]

SKILLS                                        [14pt, Helvetica-Bold, ALL CAPS]
Programming Languages: JavaScript, Python, Java, TypeScript
Frameworks: React, Node.js, Express, Django, Spring Boot
Databases: PostgreSQL, MongoDB, Redis
Cloud: AWS, Docker, Kubernetes
                                              [11pt, Helvetica, 1.15 line spacing]

EXPERIENCE                                    [14pt, Helvetica-Bold, ALL CAPS]

Senior Software Engineer                      [11pt, Helvetica-Bold]
Tech Company Inc. | January 2020 - Present   [11pt, Helvetica]
• Led development of microservices architecture serving 100,000+ daily users
• Reduced API response time by 40% through database optimization and caching
• Mentored 3 junior developers and established code review best practices
                                              [11pt, Helvetica, bullet points]

Software Engineer                             [11pt, Helvetica-Bold]
StartupCorp | June 2018 - December 2019      [11pt, Helvetica]
• Built responsive web applications using React and Node.js
• Implemented automated testing pipeline, reducing bugs by 60%
• Collaborated with design team to improve user experience metrics by 25%
                                              [11pt, Helvetica, bullet points]

EDUCATION                                     [14pt, Helvetica-Bold, ALL CAPS]

Bachelor of Science in Computer Science       [11pt, Helvetica-Bold]
University of Technology | 2018               [11pt, Helvetica]

CERTIFICATIONS                                [14pt, Helvetica-Bold, ALL CAPS]
AWS Certified Solutions Architect
Google Cloud Professional Developer
                                              [11pt, Helvetica]
[0.75" margin]
```

## FONT & SPACING SPECIFICATIONS

### Typography
- **Primary Font**: Helvetica (or Arial/Calibri as fallback)
- **Name**: 22pt, Helvetica-Bold
- **Section Headers**: 14pt, Helvetica-Bold, ALL CAPS
- **Job Titles**: 11pt, Helvetica-Bold
- **Body Text**: 11pt, Helvetica
- **Line Spacing**: 1.15 for paragraphs, 1.0 for lists

### Spacing
- **Margins**: 0.75 inches on all sides
- **Section Spacing**: 20pt between sections
- **Paragraph Spacing**: 15pt between job entries
- **Bullet Spacing**: 3pt between bullet points

### Colors & Elements
- **Text Color**: Black (#000000) only
- **No**: Lines, boxes, tables, icons, graphics, colors, backgrounds
- **Bullets**: Standard round bullets (•) only

## EXPORT INSTRUCTIONS

### Google Docs → PDF
1. File → Download → PDF Document (.pdf)
2. Ensure "Fit to page" is selected
3. Verify text is selectable in final PDF

### Microsoft Word → PDF
1. File → Export → Create PDF/XPS
2. Options → "Text" quality (not "Print")
3. Ensure "Document structure tags for accessibility" is checked
4. Click "Publish"

### Markdown → PDF (using Pandoc)
```bash
pandoc cv.md -o cv.pdf --pdf-engine=xelatex -V geometry:margin=0.75in -V fontsize=11pt -V mainfont="Helvetica"
```

### Markdown → PDF (using online tools)
1. Use Markdown to PDF converters like:
   - markdown-pdf.com
   - md2pdf.netlify.app
2. Select "Letter" size, 0.75" margins
3. Choose Helvetica or Arial font

## ATS COMPATIBILITY CHECKLIST

✅ **Structure**
- Single column layout
- Standard section headers
- Left-aligned text
- No tables or text boxes

✅ **Typography**
- ATS-safe fonts (Helvetica/Arial/Calibri)
- Readable font sizes (11-22pt)
- Black text only
- No italics for important info

✅ **Content**
- Contact info in header
- Standard bullet points
- No graphics or icons
- Searchable text

✅ **File Format**
- Text-based PDF
- Embedded fonts
- Selectable text
- Under 1MB file size

## SAMPLE SECTION FORMATTING

```
EXPERIENCE

Senior Software Engineer
Tech Company Inc. | January 2020 - Present
• Led development of microservices architecture serving 100,000+ daily users
• Reduced API response time by 40% through database optimization and caching
• Mentored 3 junior developers and established code review best practices

Software Engineer  
StartupCorp | June 2018 - December 2019
• Built responsive web applications using React and Node.js
• Implemented automated testing pipeline, reducing bugs by 60%
• Collaborated with design team to improve user experience metrics by 25%
```

This design ensures maximum ATS compatibility while maintaining professional appearance and readability.