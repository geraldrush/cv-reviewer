const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const PDFGenerator = require('./services/PDFGenerator');
const UserTierService = require('./services/UserTierService');
require('dotenv').config();

const CVAnalyzer = require('./services/CVAnalyzer');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
console.log('Initializing CV Analyzer with OpenAI API key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
const cvAnalyzer = new CVAnalyzer(process.env.OPENAI_API_KEY);
const pdfGenerator = new PDFGenerator();
const userTierService = new UserTierService();
console.log('CV Analyzer initialized successfully');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'), false);
    }
  }
});

// Unified text extraction function
function cleanText(text) {
  return text
    .replace(/\x00/g, '')                 // null bytes
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '') // non-printable
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractCvText(file) {
  if (!file) throw new Error('No file uploaded');

  const { mimetype, buffer } = file;

  switch (mimetype) {
    case 'application/pdf':
      const pdfText = await extractPDFText(buffer);
      return cleanText(pdfText);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      const result = await mammoth.extractRawText({ buffer });
      return cleanText(result.value);

    case 'text/plain':
      return cleanText(buffer.toString('utf-8'));

    default:
      throw new Error(`Unsupported CV format: ${mimetype}`);
  }
}
async function extractPDFText(buffer) {
  // Method 1: Try pdf-parse with basic options
  try {
    const data = await pdfParse(buffer, {
      normalizeWhitespace: true,
      disableCombineTextItems: false
    });
    
    if (data.text && data.text.trim().length > 50) {
      console.log('PDF extracted successfully with pdf-parse');
      return cleanText(data.text);
    }
  } catch (error) {
    console.log('pdf-parse failed:', error.message);
  }

  // Method 2: Try with alternative pdf-parse options
  try {
    const data = await pdfParse(buffer, {
      normalizeWhitespace: false,
      disableCombineTextItems: true,
      max: 0
    });
    
    if (data.text && data.text.trim().length > 20) {
      console.log('PDF extracted with alternative pdf-parse options');
      return cleanText(data.text);
    }
  } catch (error) {
    console.log('Alternative pdf-parse failed:', error.message);
  }

  console.log('All PDF extraction methods failed');
  return '';
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Main CV analysis endpoint
app.post('/api/analyze-cv', upload.single('cv'), async (req, res) => {
  try {
    const { jobDescription, targetRole, companyName, userTier } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'CV file is required' });
    }
    
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Extract text from uploaded file
    const cvText = await extractCvText(req.file);
    
    if (!cvText || cvText.trim().length < 50) {
      return res.status(400).json({ 
        error: 'CV text extraction failed or too short',
        message: 'Could not extract readable text from this file. Please try: 1) Copy and paste your CV text directly, 2) Save as TXT file, or 3) Use our CV Builder.',
        success: false
      });
    }

    const tier = userTierService.getUserTier(userTier);
    let analysis;

    if (userTierService.canUseAI(tier)) {
      // Premium: Full AI analysis
      if (companyName && targetRole) {
        analysis = await cvAnalyzer.analyzeForSpecificJob(cvText, jobDescription, companyName, targetRole);
      } else {
        analysis = await cvAnalyzer.analyzeCV(cvText, jobDescription, targetRole || '');
      }
    } else {
      // Free: Basic code-only analysis
      analysis = userTierService.getBasicAnalysis(cvText, jobDescription);
    }

    analysis.id = uuidv4();
    analysis.userTier = tier;
    
    res.json({
      success: true,
      analysis: analysis,
      extractedCvText: cvText,
      message: tier === 'premium' ? 
        `CV analysis completed with ${analysis.overallScore}% overall score` :
        'Basic analysis completed. Upgrade to Premium for AI-powered insights.'
    });

  } catch (error) {
    console.error('CV Analysis Error:', error);
    res.status(500).json({ 
      error: 'Analysis failed', 
      message: error.message,
      success: false 
    });
  }
});

// CV rewrite endpoint
app.post('/api/rewrite-cv', upload.single('cv'), async (req, res) => {
  try {
    const { jobDescription, targetRole, companyName, userTier } = req.body;
    
    if (!req.file || !jobDescription) {
      return res.status(400).json({ error: 'CV file and job description are required' });
    }

    const tier = userTierService.getUserTier(userTier);
    
    if (!userTierService.canRewriteCV(tier)) {
      return res.status(403).json({ 
        error: 'Premium feature required',
        message: 'CV rewriting is available for Premium users only. Upgrade to access AI-powered CV improvements.',
        success: false
      });
    }

    // Extract text from uploaded file
    const cvText = await extractCvText(req.file);

    // First analyze the CV
    const analysis = await cvAnalyzer.analyzeCV(cvText, jobDescription, targetRole || '');
    
    // Then rewrite it
    const rewrittenCV = await cvAnalyzer.cvRewriter.rewriteEntireCV(cvText, jobDescription, analysis);
    
    res.json({
      success: true,
      original: cvText,
      rewritten: rewrittenCV,
      analysis: analysis,
      improvements: cvAnalyzer.cvRewriter.generateImprovedCV(cvText, analysis, jobDescription)
    });

  } catch (error) {
    console.error('CV Rewrite Error:', error);
    res.status(500).json({ 
      error: 'CV rewrite failed', 
      message: error.message,
      success: false 
    });
  }
});

// Apply improvements endpoint
app.post('/api/apply-improvements', async (req, res) => {
  try {
    const { originalCV, improvements, jobDescription } = req.body;
    
    if (!originalCV || !improvements) {
      return res.status(400).json({ error: 'Original CV and improvements are required' });
    }

    const improvedCV = await cvAnalyzer.cvRewriter.applyUserImprovements(originalCV, improvements, jobDescription);
    
    res.json({
      success: true,
      improvedCV: improvedCV
    });

  } catch (error) {
    console.error('Apply Improvements Error:', error);
    res.status(500).json({ 
      error: 'Failed to apply improvements', 
      message: error.message 
    });
  }
});

// CV builder endpoints
app.get('/api/cv-questions', (req, res) => {
  try {
    const questions = cvAnalyzer.cvBuilder.getQuestions();
    res.json({ success: true, questions });
  } catch (error) {
    console.error('CV Questions Error:', error);
    res.status(500).json({ error: 'Failed to get questions', message: error.message });
  }
});

app.post('/api/build-cv', async (req, res) => {
  try {
    const { responses, jobDescription } = req.body;
    
    if (!responses) {
      return res.status(400).json({ error: 'Responses are required' });
    }
    
    cvAnalyzer.cvBuilder.validateResponses(responses);
    
    const cvResult = await cvAnalyzer.cvBuilder.generateCV(responses, jobDescription || '');
    
    res.json({
      success: true,
      cv: cvResult.text,
      structured: cvResult.structured,
      message: 'CV generated successfully'
    });
  } catch (error) {
    console.error('CV Build Error:', error);
    res.status(500).json({ 
      error: 'CV generation failed', 
      message: error.message 
    });
  }
});

// Download improved CV endpoint
app.post('/api/download-cv', async (req, res) => {
  try {
    const { cvText, structured, format = 'pdf', userTier } = req.body;
    
    const tier = userTierService.getUserTier(userTier);
    
    if (format === 'pdf' && !userTierService.canDownloadPDF(tier)) {
      return res.status(403).json({ 
        error: 'Premium feature required',
        message: 'PDF download is available for Premium users only. You can download TXT format for free.',
        success: false
      });
    }
    
    if (format === 'pdf') {
      let pdfBuffer;
      
      if (structured) {
        // Use structured data for proper formatting
        pdfBuffer = pdfGenerator.generateATSOptimizedPDF(structured);
      } else if (cvText) {
        // Use raw text to match preview exactly
        pdfBuffer = pdfGenerator.generateATSOptimizedPDF(cvText);
      } else {
        return res.status(400).json({ 
          error: 'CV data is required for PDF generation'
        });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="optimized_cv_${Date.now()}.pdf"`);
      res.send(Buffer.from(pdfBuffer));
    } else {
      if (!cvText) {
        return res.status(400).json({ error: 'CV text is required for text formats' });
      }
      
      const downloadData = cvAnalyzer.cvRewriter.formatForDownload(cvText, format);
      
      res.setHeader('Content-Type', downloadData.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${downloadData.filename}"`);
      res.send(downloadData.content);
    }

  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).json({ 
      error: 'Download failed', 
      message: error.message 
    });
  }
});
app.post('/api/quick-analyze', async (req, res) => {
  try {
    const { cvText, jobDescription, targetRole } = req.body;
    
    if (!cvText || !jobDescription) {
      return res.status(400).json({ error: 'CV text and job description are required' });
    }

    if (cvText.length < 100) {
      return res.status(400).json({ error: 'CV text is too short' });
    }

    const analysis = await cvAnalyzer.analyzeCV(cvText, jobDescription, targetRole || '');
    analysis.id = uuidv4();
    
    res.json({
      success: true,
      analysis: analysis,
      message: `Quick analysis completed - ${analysis.summary.verdict}`
    });

  } catch (error) {
    console.error('Quick Analysis Error:', error);
    res.status(500).json({ 
      error: 'Quick analysis failed', 
      message: error.message,
      success: false 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  
  console.error('Server Error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: error.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CV Reviewer API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧠 Dual-brain CV analysis ready!`);
});

module.exports = app;