const express = require('express');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const PDFGenerator = require('./services/PDFGenerator');
const UserTierService = require('./services/UserTierService');
const AuthService = require('./services/AuthService');
const PayFastService = require('./services/PayFastService');
require('dotenv').config();

const CVAnalyzer = require('./services/CVAnalyzer');
const EnhancedCVIntelligence = require('./services/EnhancedCVIntelligence');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
console.log('Initializing CV Analyzer with OpenAI API key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
const cvAnalyzer = new CVAnalyzer(process.env.OPENAI_API_KEY);
const enhancedIntelligence = new EnhancedCVIntelligence(process.env.OPENAI_API_KEY);
const pdfGenerator = new PDFGenerator();
const userTierService = new UserTierService();
const authService = new AuthService();
const payFastService = new PayFastService();
console.log('CV Analyzer initialized successfully');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'cv-reviewer-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

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

// Authentication endpoints
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Google token required' });
    }

    const user = await authService.verifyGoogleToken(token);
    req.session.userId = user.id;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        isPaid: user.isPaid
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed', message: error.message });
  }
});

app.get('/api/auth/user', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = authService.getUser(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      isPaid: user.isPaid
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Payment endpoints
app.post('/api/payment/create', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = authService.getUser(req.session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const paymentData = payFastService.generatePaymentData(user.id, user.email);
  
  res.json({
    success: true,
    paymentUrl: payFastService.getPaymentUrl(),
    paymentData
  });
});

app.post('/api/payment/notify', (req, res) => {
  try {
    const isValid = payFastService.verifyPayment(req.body);
    
    if (isValid && req.body.payment_status === 'COMPLETE') {
      const userId = req.body.m_payment_id;
      authService.updateUserPaymentStatus(userId, true);
      console.log(`Payment completed for user: ${userId}`);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Payment notification error:', error);
    res.status(400).send('Error');
  }
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
    
    // Debug: Log CV text extraction
    console.log('=== CV TEXT EXTRACTION DEBUG ===');
    console.log('CV Text Length:', cvText.length);
    console.log('First 200 characters:', cvText.substring(0, 200));
    console.log('Contains email:', /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(cvText));
    console.log('Contains phone:', /[\+]?[\d\s\-\(\)]{10,}/.test(cvText));
    console.log('================================');
    
    if (!cvText || cvText.trim().length < 50) {
      return res.status(400).json({ 
        error: 'CV text extraction failed or too short',
        message: 'Could not extract readable text from this file. Please try: 1) Copy and paste your CV text directly, 2) Save as TXT file, or 3) Use our CV Builder.',
        success: false,
        debug: {
          extractedLength: cvText ? cvText.length : 0,
          fileType: req.file.mimetype,
          fileName: req.file.originalname
        }
      });
    }

    const tier = userTierService.getUserTier(userTier);
    console.log('User tier:', tier, 'Can use AI:', userTierService.canUseAI(tier));
    let analysis;

    if (userTierService.canUseAI(tier)) {
      // Premium: Enhanced AI analysis
      const industry = enhancedIntelligence.detectIndustry(jobDescription, cvText);
      const bullets = enhancedIntelligence.extractBullets(cvText);
      
      // Debug: Log analysis inputs
      console.log('=== ANALYSIS DEBUG ===');
      console.log('Detected Industry:', industry);
      console.log('Extracted Bullets:', bullets.length);
      console.log('Sample bullets:', bullets.slice(0, 3));
      console.log('CV starts with:', cvText.substring(0, 100));
      console.log('Is cover letter check:', cvText.toLowerCase().includes('cover letter'));
      console.log('=====================');
      
      const bulletAnalyses = bullets.map(bullet => enhancedIntelligence.analyzeBulletQuality(bullet, industry));
      
      const keywordMatch = enhancedIntelligence.analyzeKeywordMatch(cvText, jobDescription, industry);
      console.log('Keyword match result:', { isMismatch: keywordMatch.isMismatch, mismatchPenalty: keywordMatch.mismatchPenalty });
      
      const atsCompatibility = enhancedIntelligence.calculateATSCompatibility(cvText);
      const recruiterScore = enhancedIntelligence.calculateRecruiterScore(cvText, bulletAnalyses);
      const overallScore = enhancedIntelligence.generateOverallScore(
        atsCompatibility.score, 
        recruiterScore.score, 
        keywordMatch, 
        bulletAnalyses
      );
      
      console.log('Final scores:', { ats: atsCompatibility.score, recruiter: recruiterScore.score, overall: overallScore });

      analysis = {
        overallScore,
        industry,
        debug: {
          cvTextLength: cvText.length,
          bulletsFound: bulletAnalyses.length,
          atsScore: atsCompatibility.score,
          recruiterScore: recruiterScore.score,
          keywordMatches: {
            mandatory: keywordMatch.mandatory.matched,
            skills: keywordMatch.skills.matched
          }
        },
        atsAnalysis: {
          rankingScore: atsCompatibility.score,
          parsingScore: { score: atsCompatibility.score },
          keywordMatch,
          issues: atsCompatibility.issues
        },
        recruiterAnalysis: {
          scanScore: recruiterScore.score,
          firstImpressionScore: recruiterScore.factors.firstImpression,
          stopReadingPoint: recruiterScore.stopReadingPoint,
          bulletAnalysis: {
            total: bulletAnalyses.length,
            withMetrics: bulletAnalyses.filter(b => b.factors.metrics.score > 0).length
          }
        },
        intelligenceAnalysis: {
          bullets: {
            totalBullets: bulletAnalyses.length,
            bulletAnalysis: bulletAnalyses,
            overallScore: bulletAnalyses.length ? Math.round(bulletAnalyses.reduce((acc, b) => acc + b.score, 0) / bulletAnalyses.length) : 0
          }
        },
        matchPercentage: Math.round((keywordMatch.mandatory.percentage + keywordMatch.skills.percentage) / 2),
        summary: {
          verdict: keywordMatch.isMismatch ? 'WRONG INDUSTRY - NOT SUITABLE' : 
                   overallScore >= 85 ? 'Excellent Match' : 
                   overallScore >= 70 ? 'Good Match' : 
                   overallScore >= 50 ? 'Fair Match' : 
                   overallScore >= 25 ? 'Needs Major Improvement' : 'NOT A VALID CV',
          keyStrengths: this.generateStrengths(bulletAnalyses, keywordMatch),
          majorWeaknesses: this.generateWeaknesses(atsCompatibility, recruiterScore, bulletAnalyses, keywordMatch),
          quickWins: this.generateQuickWins(bulletAnalyses, keywordMatch),
          timeToImprove: keywordMatch.isMismatch ? 'Need completely different CV for this role' : 
                        bulletAnalyses.filter(b => b.score < 60).length > 5 ? '2-3 hours' : '30-60 minutes'
        }
      };
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
        `Enhanced CV analysis completed with ${analysis.overallScore}% overall score` :
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

// Helper functions for analysis
function generateStrengths(bulletAnalyses, keywordMatch) {
  const strengths = [];
  
  const strongBullets = bulletAnalyses.filter(b => b.score >= 70).length;
  if (strongBullets > bulletAnalyses.length * 0.6) {
    strengths.push('Strong achievement-focused bullet points');
  }
  
  if (keywordMatch.skills.percentage > 70) {
    strengths.push('Excellent technical skill alignment');
  }
  
  const hasMetrics = bulletAnalyses.filter(b => b.factors.metrics.score > 0).length;
  if (hasMetrics > bulletAnalyses.length * 0.5) {
    strengths.push('Good use of quantifiable metrics');
  }
  
  return strengths.length ? strengths : ['CV structure is readable'];
}

function generateWeaknesses(atsCompatibility, recruiterScore, bulletAnalyses, keywordMatch) {
  const weaknesses = [];
  
  // CRITICAL: Check for job-CV mismatch first - this should be the primary weakness
  if (keywordMatch && keywordMatch.isMismatch) {
    weaknesses.push('MAJOR ISSUE: This CV is for a completely different industry/role');
    weaknesses.push('Skills and experience do not match the job requirements at all');
    weaknesses.push('You need a CV specifically tailored for this role to be considered');
    return weaknesses;
  }
  
  // Check if this is even a CV document
  if (atsCompatibility.issues && atsCompatibility.issues.includes('Document does not appear to be a CV or resume')) {
    weaknesses.push('CRITICAL: This document is not a CV or resume');
    weaknesses.push('Please upload a proper CV with work experience and skills');
    return weaknesses;
  }
  
  // Check for very low keyword match (indicates wrong field/industry)
  if (keywordMatch && keywordMatch.mandatory && keywordMatch.mandatory.percentage < 20) {
    weaknesses.push('MAJOR MISMATCH: CV appears to be for a different field entirely');
    weaknesses.push('Almost no relevant keywords or skills found for this job');
  }
  
  if (atsCompatibility.score < 70) {
    weaknesses.push('ATS compatibility issues detected');
  }
  
  const weakBullets = bulletAnalyses.filter(b => b.score < 50).length;
  if (weakBullets > bulletAnalyses.length * 0.4) {
    weaknesses.push('Multiple weak bullet points need improvement');
  }
  
  if (recruiterScore.stopReadingPoint) {
    weaknesses.push('Early stop-reading triggers detected');
  }
  
  return weaknesses.length ? weaknesses : ['Minor formatting improvements needed'];
}

function generateQuickWins(bulletAnalyses, keywordMatch) {
  const quickWins = [];
  
  const noMetricsBullets = bulletAnalyses.filter(b => b.factors.metrics.score === 0).length;
  if (noMetricsBullets > 0) {
    quickWins.push(`Add metrics to ${noMetricsBullets} bullet points`);
  }
  
  if (keywordMatch.mandatory.missing.length > 0) {
    quickWins.push(`Include missing keywords: ${keywordMatch.mandatory.missing.slice(0, 3).join(', ')}`);
  }
  
  const weakActionVerbs = bulletAnalyses.filter(b => b.factors.actionVerb.score === 0).length;
  if (weakActionVerbs > 0) {
    quickWins.push(`Strengthen ${weakActionVerbs} bullet points with action verbs`);
  }
  
  return quickWins.length ? quickWins : ['Optimize formatting for better ATS parsing'];
}

// CV rewrite endpoint
app.post('/api/rewrite-cv', upload.single('cv'), async (req, res) => {
  try {
    // Check authentication
    if (!req.session.userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in with Google to access CV rewriting.',
        requiresAuth: true
      });
    }

    const user = authService.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check payment status
    if (!user.isPaid) {
      return res.status(403).json({ 
        error: 'Payment required',
        message: 'CV rewriting requires premium access. Please complete payment to continue.',
        requiresPayment: true
      });
    }

    const { jobDescription, targetRole, companyName } = req.body;
    
    if (!req.file || !jobDescription) {
      return res.status(400).json({ error: 'CV file and job description are required' });
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