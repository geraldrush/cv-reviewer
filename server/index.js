const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const PDFGenerator = require('./services/PDFGenerator');
require('dotenv').config();

const CVAnalyzer = require('./services/CVAnalyzer');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize CV Analyzer and PDF Generator
console.log('Initializing CV Analyzer with OpenAI API key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
const cvAnalyzer = new CVAnalyzer(process.env.OPENAI_API_KEY);
const pdfGenerator = new PDFGenerator();
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
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'), false);
    }
  }
});

// PDF text extraction function with multiple methods
async function extractPDFText(buffer) {
  // Method 1: Try pdf-parse
  try {
    const data = await pdfParse(buffer, {
      normalizeWhitespace: true,
      disableCombineTextItems: false
    });
    
    if (data.text && data.text.trim().length > 50) {
      console.log('PDF extracted successfully with pdf-parse');
      return data.text;
    }
  } catch (error) {
    console.log('pdf-parse failed:', error.message);
  }

  // Method 2: Try pdf-lib
  try {
    const { PDFDocument } = require('pdf-lib');
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();
    
    // For corrupted PDFs, return a helpful message instead of empty text
    if (pages.length > 0) {
      console.log('PDF structure detected but text extraction limited');
      return 'PDF file detected but text extraction failed. Please copy and paste your CV text directly or save as a TXT file for better results. You can also try using the CV Builder to create a new CV from scratch.';
    }
  } catch (error) {
    console.log('pdf-lib failed:', error.message);
  }

  // Method 3: Try with different pdf-parse options
  try {
    const data = await pdfParse(buffer, {
      normalizeWhitespace: false,
      disableCombineTextItems: true,
      max: 0
    });
    
    if (data.text && data.text.trim().length > 20) {
      console.log('PDF extracted with alternative pdf-parse options');
      return data.text;
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
    const { jobDescription, targetRole, companyName } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'CV file is required' });
    }
    
    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Extract text from uploaded file
    let cvText = '';
    
    if (req.file.mimetype === 'application/pdf') {
      cvText = await extractPDFText(req.file.buffer);
    if (!cvText || cvText.trim().length < 50) {
        return res.status(400).json({ 
          error: 'PDF text extraction failed',
          message: 'Could not extract readable text from this PDF. Please try one of these options: 1) Copy and paste your CV text directly using the text input option, 2) Save your CV as a TXT file and upload again, or 3) Use our CV Builder to create a new CV from scratch.',
          success: false,
          suggestions: [
            'Copy and paste CV text directly',
            'Save CV as TXT file and re-upload', 
            'Use the CV Builder to create from scratch'
          ]
        });
      }
    } else {
      cvText = req.file.buffer.toString('utf-8');
    }

    if (!cvText || cvText.trim().length < 50) {
      return res.status(400).json({ 
        error: 'CV text is too short or could not be extracted',
        message: 'The CV text appears to be too short for analysis. Please ensure your CV contains at least 100 characters of meaningful content.',
        success: false
      });
    }

    // Perform analysis
    let analysis;
    if (companyName && targetRole) {
      analysis = await cvAnalyzer.analyzeForSpecificJob(cvText, jobDescription, companyName, targetRole);
    } else {
      analysis = await cvAnalyzer.analyzeCV(cvText, jobDescription, targetRole || '');
    }

    analysis.id = uuidv4();
    
    res.json({
      success: true,
      analysis: analysis,
      message: `CV analysis completed with ${analysis.overallScore}% overall score`
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
    const { jobDescription, targetRole, companyName } = req.body;
    
    if (!req.file || !jobDescription) {
      return res.status(400).json({ error: 'CV file and job description are required' });
    }

    // Extract text from uploaded file
    let cvText = '';
    if (req.file.mimetype === 'application/pdf') {
      cvText = await extractPDFText(req.file.buffer);
    } else {
      cvText = req.file.buffer.toString('utf-8');
    }

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
    const { cvText, structured, format = 'pdf' } = req.body;
    
    if (!cvText && !structured) {
      return res.status(400).json({ error: 'CV data is required' });
    }

    if (format === 'pdf') {
      // Use structured data if available, otherwise parse text
      const cvData = structured || pdfGenerator.parseTextCV(cvText);
      const pdfBuffer = await pdfGenerator.generateATSOptimizedPDF(cvData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="optimized_cv_${Date.now()}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer, 'binary');
    } else {
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